-- =============================================================================
-- 011_functions_and_triggers.sql
-- Funções de negócio, triggers de consistência e jobs
-- =============================================================================

-- ─── updated_at trigger ──────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Aplicar em todas as tabelas com updated_at
do $$
declare
  t record;
begin
  for t in
    select table_schema, table_name
    from information_schema.columns
    where column_name = 'updated_at'
      and table_schema in ('identity', 'org', 'loyalty', 'redemption', 'promo', 'config', 'comms')
  loop
    execute format(
      'create trigger set_updated_at before update on %I.%I
       for each row execute function public.set_updated_at()',
      t.table_schema, t.table_name
    );
  end loop;
end $$;

-- ─── Gerar código público ─────────────────────────────────────────────────────
-- Formato: DSP-YYYYMMDD-NNNNN (compra), DSR-YYYYMMDD-NNNNN (resgate)
create or replace function public.generate_public_code(prefix text)
returns text language plpgsql as $$
declare
  date_part text := to_char(now() at time zone 'America/Sao_Paulo', 'YYYYMMDD');
  seq_part  text;
begin
  -- Sequência simples: lpad do microsegundo para evitar colisão
  seq_part := lpad((extract(epoch from now()) * 1000)::bigint::text % 100000, 5, '0');
  return prefix || '-' || date_part || '-' || seq_part;
end;
$$;

-- ─── Calcular pontos (regra parametrizada) ────────────────────────────────────
create or replace function loyalty.calculate_points(
  p_eligible_cents  integer,
  p_rule_id         uuid,
  p_multiplier      numeric default 1.0
)
returns integer language plpgsql stable security definer as $$
declare
  v_rule loyalty.loyalty_rules%rowtype;
  v_base integer;
begin
  select * into v_rule from loyalty.loyalty_rules where id = p_rule_id;

  if not found then
    raise exception 'Loyalty rule not found: %', p_rule_id;
  end if;

  if p_eligible_cents < v_rule.min_purchase_cents then
    return 0;
  end if;

  -- Fórmula: floor(eligible / cents_per_point) * multiplier
  v_base := case v_rule.rounding
    when 'floor' then floor(p_eligible_cents::numeric / v_rule.cents_per_point)
    when 'round' then round(p_eligible_cents::numeric / v_rule.cents_per_point)
    when 'ceil'  then ceil(p_eligible_cents::numeric / v_rule.cents_per_point)
    else floor(p_eligible_cents::numeric / v_rule.cents_per_point)
  end;

  return greatest(0, floor(v_base * p_multiplier))::integer;
end;
$$;

-- ─── Crédito atômico de pontos (earn + lote + ledger) ────────────────────────
-- ATENÇÃO: Esta função deve ser chamada SOMENTE por Edge Functions com service role.
-- Nunca expor via PostgREST ou chamar pelo cliente.
create or replace function loyalty.credit_points(
  p_customer_id     uuid,
  p_store_id        uuid,
  p_points          integer,
  p_source_type     loyalty.transaction_type,
  p_rule_id         uuid default null,
  p_invoice_id      uuid default null,
  p_campaign_id     uuid default null,
  p_description     text default null,
  p_idempotency_key text default null
)
returns table(
  transaction_id  uuid,
  lot_id          uuid,
  points_after    integer
)
language plpgsql security definer as $$
declare
  v_account_id    uuid;
  v_lot_id        uuid;
  v_txn_id        uuid;
  v_points_after  integer;
  v_rule          loyalty.loyalty_rules%rowtype;
  v_expires_at    timestamptz;
begin
  -- Idempotência: retornar operação existente se a chave já foi usada
  if p_idempotency_key is not null then
    select t.id, t.lot_id, t.points_after
    into v_txn_id, v_lot_id, v_points_after
    from loyalty.point_transactions t
    where t.idempotency_key = p_idempotency_key
    limit 1;

    if found then
      return query select v_txn_id, v_lot_id, v_points_after;
      return;
    end if;
  end if;

  -- Validações
  if p_points <= 0 then
    raise exception 'Points must be positive, got: %', p_points;
  end if;

  -- Buscar ou criar conta de fidelidade
  select la.id into v_account_id
  from loyalty.loyalty_accounts la
  join org.stores s on s.organization_id = la.organization_id
  where la.customer_id = p_customer_id
    and s.id = p_store_id
  limit 1;

  if v_account_id is null then
    -- Criar conta na organização da loja
    insert into loyalty.loyalty_accounts (customer_id, organization_id)
    select p_customer_id, s.organization_id
    from org.stores s where s.id = p_store_id
    returning id into v_account_id;
  end if;

  -- Calcular validade do lote
  if p_rule_id is not null then
    select * into v_rule from loyalty.loyalty_rules where id = p_rule_id;
    v_expires_at := case v_rule.expiry_policy
      when 'none'       then null
      when 'monthly'    then date_trunc('month', now()) + interval '1 month' - interval '1 day'
      when 'semiannual' then now() + interval '6 months'
      when 'annual'     then now() + interval '1 year'
      when 'custom'     then now() + (v_rule.expiry_days || ' days')::interval
      else null
    end;
  end if;

  -- Criar lote
  insert into loyalty.point_lots (
    account_id, store_id, points_original, points_remaining,
    source_type, invoice_id, campaign_id, rule_id, expires_at
  ) values (
    v_account_id, p_store_id, p_points, p_points,
    p_source_type, p_invoice_id, p_campaign_id, p_rule_id, v_expires_at
  ) returning id into v_lot_id;

  -- Atualizar saldo
  update loyalty.loyalty_accounts
  set points_available = points_available + p_points,
      points_lifetime  = points_lifetime  + p_points,
      last_activity_at = now()
  where id = v_account_id
  returning points_available into v_points_after;

  -- Ledger
  insert into loyalty.point_transactions (
    account_id, store_id, lot_id, transaction_type,
    points_delta, points_after, invoice_id, campaign_id,
    description, public_code, idempotency_key
  ) values (
    v_account_id, p_store_id, v_lot_id, p_source_type,
    p_points, v_points_after, p_invoice_id, p_campaign_id,
    coalesce(p_description, 'Pontos creditados'), public.generate_public_code('DSP'),
    p_idempotency_key
  ) returning id into v_txn_id;

  -- Outbox event
  insert into audit.outbox_events (event_type, aggregate_type, aggregate_id, payload)
  values (
    'loyalty.points_earned',
    'loyalty_account',
    v_account_id,
    jsonb_build_object(
      'customer_id', p_customer_id,
      'points', p_points,
      'lot_id', v_lot_id,
      'invoice_id', p_invoice_id
    )
  );

  return query select v_txn_id, v_lot_id, v_points_after;
end;
$$;

-- ─── Reserva FIFO de pontos para resgate ──────────────────────────────────────
create or replace function loyalty.reserve_points_fifo(
  p_account_id  uuid,
  p_points      integer,
  p_intent_id   uuid
)
returns boolean language plpgsql security definer as $$
declare
  v_lot             loyalty.point_lots%rowtype;
  v_remaining_need  integer := p_points;
  v_to_reserve      integer;
begin
  -- Verificar saldo disponível
  if (select points_available from loyalty.loyalty_accounts where id = p_account_id) < p_points then
    raise exception 'Insufficient points for reservation';
  end if;

  -- FIFO: consumir lotes pelo vencimento mais próximo primeiro
  for v_lot in
    select * from loyalty.point_lots
    where account_id = p_account_id
      and status = 'active'
      and points_remaining > 0
      and (expires_at is null or expires_at > now())
    order by expires_at asc nulls last, acquired_at asc
    for update skip locked  -- lock apenas os lotes sendo processados
  loop
    exit when v_remaining_need = 0;

    v_to_reserve := least(v_lot.points_remaining, v_remaining_need);

    -- Atualizar lote
    update loyalty.point_lots
    set points_remaining = points_remaining - v_to_reserve,
        status = case when points_remaining - v_to_reserve = 0 then 'depleted' else status end,
        depleted_at = case when points_remaining - v_to_reserve = 0 then now() else null end
    where id = v_lot.id;

    -- Registrar reserva
    insert into loyalty.lot_reservations (lot_id, intent_id, points_reserved)
    values (v_lot.id, p_intent_id, v_to_reserve);

    v_remaining_need := v_remaining_need - v_to_reserve;
  end loop;

  if v_remaining_need > 0 then
    raise exception 'Could not reserve all points (% remaining)', v_remaining_need;
  end if;

  -- Atualizar saldo
  update loyalty.loyalty_accounts
  set points_available = points_available - p_points,
      points_reserved  = points_reserved  + p_points,
      last_activity_at = now()
  where id = p_account_id;

  return true;
end;
$$;

-- ─── Job de expiração de pontos (idempotente) ─────────────────────────────────
create or replace function loyalty.expire_points_job()
returns integer language plpgsql security definer as $$
declare
  v_lot         loyalty.point_lots%rowtype;
  v_expired     integer := 0;
  v_points_lost integer;
begin
  for v_lot in
    select * from loyalty.point_lots
    where status = 'active'
      and expires_at <= now()
      and points_remaining > 0
    for update skip locked
  loop
    v_points_lost := v_lot.points_remaining;

    -- Expirar lote
    update loyalty.point_lots
    set status = 'expired', points_remaining = 0, expired_at = now()
    where id = v_lot.id;

    -- Deduzir do saldo
    update loyalty.loyalty_accounts
    set points_available = greatest(0, points_available - v_points_lost)
    where id = v_lot.account_id;

    -- Ledger
    insert into loyalty.point_transactions (
      account_id, lot_id, transaction_type, points_delta, points_after, description, public_code
    )
    select
      v_lot.account_id,
      v_lot.id,
      'expire',
      -v_points_lost,
      la.points_available,
      'Pontos expirados automaticamente',
      public.generate_public_code('DSP')
    from loyalty.loyalty_accounts la
    where la.id = v_lot.account_id;

    -- Outbox
    insert into audit.outbox_events (event_type, aggregate_type, aggregate_id, payload)
    values (
      'loyalty.points_expired',
      'point_lot',
      v_lot.id,
      jsonb_build_object('points_lost', v_points_lost, 'account_id', v_lot.account_id)
    );

    v_expired := v_expired + 1;
  end loop;

  return v_expired;
end;
$$;
