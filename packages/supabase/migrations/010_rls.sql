-- =============================================================================
-- 010_rls.sql
-- Row Level Security — deny-by-default, políticas por papel e relação
-- =============================================================================

-- ─── Habilitar RLS em todas as tabelas ───────────────────────────────────────

-- identity
alter table identity.customers                  enable row level security;
alter table identity.customer_contact_points    enable row level security;
alter table identity.otp_attempts               enable row level security;
alter table identity.consents                   enable row level security;
alter table identity.privacy_requests           enable row level security;

-- org
alter table org.organizations                   enable row level security;
alter table org.stores                          enable row level security;
alter table org.admins                          enable row level security;
alter table org.organization_memberships        enable row level security;
alter table org.store_memberships               enable row level security;
alter table org.permissions                     enable row level security;
alter table org.role_permissions                enable row level security;
alter table org.member_permission_overrides     enable row level security;

-- fiscal
alter table fiscal.scanned_invoices             enable row level security;
alter table fiscal.invoice_validation_attempts  enable row level security;
alter table fiscal.invoice_risk_signals         enable row level security;

-- loyalty
alter table loyalty.loyalty_rules               enable row level security;
alter table loyalty.loyalty_accounts            enable row level security;
alter table loyalty.point_lots                  enable row level security;
alter table loyalty.point_transactions          enable row level security;
alter table loyalty.lot_reservations            enable row level security;

-- redemption
alter table redemption.discount_redemption_intents  enable row level security;
alter table redemption.discount_redemption_events   enable row level security;
alter table redemption.rewards                      enable row level security;
alter table redemption.reward_inventory             enable row level security;

-- promo
alter table promo.promotions        enable row level security;
alter table promo.campaigns         enable row level security;
alter table promo.coupons           enable row level security;
alter table promo.coupon_assignments enable row level security;

-- comms
alter table comms.notifications             enable row level security;
alter table comms.notification_deliveries   enable row level security;
alter table comms.notification_preferences  enable row level security;
alter table comms.device_tokens             enable row level security;

-- config
alter table config.store_settings       enable row level security;
alter table config.app_feature_flags    enable row level security;

-- audit (somente service role pode inserir; leitura restrita)
alter table audit.audit_events  enable row level security;
alter table audit.outbox_events enable row level security;

-- legacy
alter table legacy.import_batches       enable row level security;
alter table legacy.customer_profiles    enable row level security;
alter table legacy.customer_claims      enable row level security;

-- ─── Funções auxiliares ───────────────────────────────────────────────────────

-- Retorna o customer_id vinculado ao usuário autenticado atual
create or replace function identity.current_customer_id()
returns uuid language sql stable security definer as $$
  select id from identity.customers
  where auth_user_id = auth.uid()
  limit 1;
$$;

-- Verifica se o usuário autenticado é admin com membership ativo na organização
create or replace function org.is_org_member(p_organization_id uuid, p_min_role org.member_role default 'viewer')
returns boolean language sql stable security definer as $$
  select exists (
    select 1
    from org.admins a
    join org.organization_memberships m on m.admin_id = a.id
    where a.auth_user_id = auth.uid()
      and m.organization_id = p_organization_id
      and m.status = 'active'
  );
$$;

-- Verifica se o admin tem permissão específica na organização
create or replace function org.has_permission(p_organization_id uuid, p_permission_code text)
returns boolean language sql stable security definer as $$
  select exists (
    select 1
    from org.admins a
    join org.organization_memberships m on m.admin_id = a.id
    left join org.role_permissions rp
          on rp.organization_id = m.organization_id
         and rp.role = m.role
         and rp.permission_code = p_permission_code
    left join org.member_permission_overrides ov
          on ov.membership_id = m.id
         and ov.permission_code = p_permission_code
    where a.auth_user_id = auth.uid()
      and m.organization_id = p_organization_id
      and m.status = 'active'
      and (
        -- permissão pelo papel OU override individual
        (rp.permission_code is not null and (ov.granted is null or ov.granted = true))
        or ov.granted = true
      )
  );
$$;

-- ─── Políticas: identity.customers ───────────────────────────────────────────

-- Cliente lê apenas seu próprio perfil
create policy "customer: read own" on identity.customers
  for select using (auth_user_id = auth.uid());

-- Cliente atualiza apenas campos permitidos (via função, não direto)
-- UPDATE direto na tabela pelo cliente não é permitido; apenas via RPCs
create policy "customer: no direct update" on identity.customers
  for update using (false);

-- Admins com permissão leem clientes da organização (via RPC, não PostgREST direto)
-- PostgREST expõe apenas o schema público; admins usam funções com security definer

-- ─── Políticas: identity.consents ────────────────────────────────────────────
create policy "customer: read own consents" on identity.consents
  for select using (customer_id = identity.current_customer_id());

create policy "customer: insert own consent" on identity.consents
  for insert with check (customer_id = identity.current_customer_id());

-- ─── Políticas: identity.privacy_requests ────────────────────────────────────
create policy "customer: read own privacy requests" on identity.privacy_requests
  for select using (customer_id = identity.current_customer_id());

create policy "customer: create own privacy request" on identity.privacy_requests
  for insert with check (customer_id = identity.current_customer_id());

-- ─── Políticas: loyalty.loyalty_accounts ─────────────────────────────────────
create policy "customer: read own account" on loyalty.loyalty_accounts
  for select using (customer_id = identity.current_customer_id());

-- ─── Políticas: loyalty.point_transactions ───────────────────────────────────
create policy "customer: read own transactions" on loyalty.point_transactions
  for select using (
    account_id in (
      select id from loyalty.loyalty_accounts
      where customer_id = identity.current_customer_id()
    )
  );

-- ─── Políticas: loyalty.point_lots ───────────────────────────────────────────
create policy "customer: read own lots" on loyalty.point_lots
  for select using (
    account_id in (
      select id from loyalty.loyalty_accounts
      where customer_id = identity.current_customer_id()
    )
  );

-- ─── Políticas: fiscal.scanned_invoices ──────────────────────────────────────
create policy "customer: read own invoices" on fiscal.scanned_invoices
  for select using (customer_id = identity.current_customer_id());

-- ─── Políticas: redemption.discount_redemption_intents ───────────────────────
create policy "customer: read own redemptions" on redemption.discount_redemption_intents
  for select using (customer_id = identity.current_customer_id());

-- ─── Políticas: redemption.rewards ────────────────────────────────────────────
-- Todos os clientes autenticados veem recompensas ativas
create policy "customer: read active rewards" on redemption.rewards
  for select using (
    status = 'active'
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  );

-- ─── Políticas: promo.coupons ─────────────────────────────────────────────────
create policy "customer: read assigned coupons" on promo.coupon_assignments
  for select using (customer_id = identity.current_customer_id());

-- ─── Políticas: comms.notifications ──────────────────────────────────────────
create policy "customer: read own notifications" on comms.notifications
  for select using (customer_id = identity.current_customer_id());

create policy "customer: mark notification read" on comms.notifications
  for update using (customer_id = identity.current_customer_id())
  with check (customer_id = identity.current_customer_id());

-- ─── Políticas: comms.notification_preferences ────────────────────────────────
create policy "customer: read own preferences" on comms.notification_preferences
  for select using (customer_id = identity.current_customer_id());

create policy "customer: update own preferences" on comms.notification_preferences
  for update using (customer_id = identity.current_customer_id())
  with check (customer_id = identity.current_customer_id());

-- ─── Políticas: audit (somente service role e admins autorizados) ─────────────
-- Auditoria não é acessível via PostgREST pelo cliente
-- Admins acessam via RPCs com security definer

-- Nenhuma política criada = nenhum acesso via PostgREST
-- (RLS habilitado + sem policy = deny all para roles não-service)
