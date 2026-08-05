-- =============================================================================
-- 005_loyalty.sql
-- Contas de pontos, lotes, transações, regras — núcleo do produto
-- =============================================================================

-- ─── loyalty_rules ───────────────────────────────────────────────────────────
-- Regras de acúmulo configuráveis (NUNCA hardcodar valores no código)
create table loyalty.loyalty_rules (
  id                      uuid        primary key default uuid_generate_v4(),
  store_id                uuid        not null references org.stores(id) on delete restrict,
  name                    text        not null,
  is_active               boolean     not null default true,

  -- Acúmulo
  cents_per_point         integer     not null default 800   -- R$ 8,00 = 800 centavos por ponto
                          check (cents_per_point > 0),
  min_purchase_cents      integer     not null default 800   -- mínimo para pontuar
                          check (min_purchase_cents >= 0),
  rounding                text        not null default 'floor'
                          check (rounding in ('floor', 'round', 'ceil')),

  -- Resgate
  point_value_cents       integer     not null default 100   -- 1 ponto = R$ 1,00 em desconto
                          check (point_value_cents > 0),
  min_redemption_points   integer     not null default 8     -- mínimo de pontos para resgatar
                          check (min_redemption_points > 0),
  redemption_step_points  integer     not null default 1     -- incremento (ex: resgatar em múltiplos de X)
                          check (redemption_step_points > 0),
  min_purchase_for_redemption_cents integer not null default 0,

  -- Validade dos pontos
  expiry_policy           text        not null default 'annual'
                          check (expiry_policy in ('none', 'monthly', 'semiannual', 'annual', 'custom')),
  expiry_days             integer,    -- para policy = 'custom'

  -- Token de resgate
  redemption_token_ttl_seconds integer not null default 300   -- 5 minutos

                          check (redemption_token_ttl_seconds between 60 and 3600),

  -- Limites
  max_scans_per_day_per_customer integer not null default 3,
  max_points_per_transaction     integer,  -- null = sem limite

  -- Auditoria
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  created_by              uuid        references org.admins(id) on delete set null
);

comment on table loyalty.loyalty_rules is 'Parâmetros de pontuação e resgate — fonte de verdade para cálculos';
comment on column loyalty.loyalty_rules.cents_per_point is 'Centavos de compra necessários para ganhar 1 ponto';
comment on column loyalty.loyalty_rules.point_value_cents is 'Valor em centavos de cada ponto no resgate (uso promocional, não é dinheiro)';

create index loyalty_rules_store_idx on loyalty.loyalty_rules(store_id, is_active);

-- ─── loyalty_accounts ────────────────────────────────────────────────────────
create table loyalty.loyalty_accounts (
  id                  uuid        primary key default uuid_generate_v4(),
  customer_id         uuid        unique not null references identity.customers(id) on delete restrict,
  organization_id     uuid        not null references org.organizations(id) on delete restrict,

  -- Saldos (calculados via ledger — manter sincronizados por trigger/RPC)
  points_available    integer     not null default 0 check (points_available >= 0),
  points_reserved     integer     not null default 0 check (points_reserved >= 0),
  points_lifetime     integer     not null default 0 check (points_lifetime >= 0), -- para nível VIP

  -- VIP
  vip_level           text        not null default 'bronze',  -- bronze, silver, gold (parametrizado)

  -- Controle
  last_activity_at    timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on column loyalty.loyalty_accounts.points_lifetime is 'Total histórico — inclui pontos já resgatados (usado para nível VIP)';
create index accounts_org_idx      on loyalty.loyalty_accounts(organization_id);
create index accounts_activity_idx on loyalty.loyalty_accounts(last_activity_at desc);

-- ─── point_lots ──────────────────────────────────────────────────────────────
-- Cada crédito gera um lote com validade própria
create table loyalty.point_lots (
  id                  uuid                primary key default uuid_generate_v4(),
  account_id          uuid                not null references loyalty.loyalty_accounts(id) on delete restrict,
  store_id            uuid                references org.stores(id) on delete set null,

  -- Pontos
  points_original     integer             not null check (points_original > 0),
  points_remaining    integer             not null check (points_remaining >= 0),

  -- Origem
  source_type         loyalty.transaction_type not null,  -- earn, bonus, import
  invoice_id          uuid,               -- FK para fiscal.scanned_invoices, adicionada depois
  campaign_id         uuid,               -- FK para promo.campaigns, adicionada depois

  -- Validade
  acquired_at         timestamptz         not null default now(),
  expires_at          timestamptz,        -- null = sem expiração

  -- Estado
  status              loyalty.lot_status  not null default 'active',
  depleted_at         timestamptz,
  expired_at          timestamptz,

  -- Rastreabilidade
  rule_id             uuid                references loyalty.loyalty_rules(id) on delete set null,
  created_at          timestamptz         not null default now()
);

comment on table loyalty.point_lots is 'Lotes de pontos — resgate utiliza FIFO pelo vencimento mais próximo';
create index lots_account_idx      on loyalty.point_lots(account_id, status, expires_at asc nulls last);
create index lots_expires_idx      on loyalty.point_lots(expires_at asc) where status = 'active' and expires_at is not null;

-- ─── point_transactions ──────────────────────────────────────────────────────
-- Ledger append-only — NUNCA atualizar ou deletar linhas
create table loyalty.point_transactions (
  id                  uuid                        primary key default uuid_generate_v4(),
  account_id          uuid                        not null references loyalty.loyalty_accounts(id) on delete restrict,
  store_id            uuid                        references org.stores(id) on delete set null,
  lot_id              uuid                        references loyalty.point_lots(id) on delete restrict,

  -- Operação
  transaction_type    loyalty.transaction_type    not null,
  points_delta        integer                     not null,  -- positivo = entrada, negativo = saída
  points_after        integer                     not null,  -- saldo após esta transação

  -- Referências
  invoice_id          uuid,       -- FK adicionada depois
  redemption_id       uuid,       -- FK adicionada depois
  campaign_id         uuid,       -- FK adicionada depois
  reverse_of          uuid        references loyalty.point_transactions(id) on delete restrict,

  -- Descrição
  description         text        not null,
  public_code         text        unique,  -- DSP-YYYYMMDD-NNNNN

  -- Metadados
  performed_by        uuid        references org.admins(id) on delete set null,
  justification       text,       -- obrigatório para adjustment e reverse
  idempotency_key     text        unique,

  -- Auditoria
  created_at          timestamptz not null default now()
);

comment on table loyalty.point_transactions is 'Ledger append-only — erros corrigidos por lançamento compensatório';
create index txn_account_idx    on loyalty.point_transactions(account_id, created_at desc);
create index txn_type_idx       on loyalty.point_transactions(transaction_type, created_at desc);
create index txn_idempotency_idx on loyalty.point_transactions(idempotency_key) where idempotency_key is not null;

-- ─── lot_reservations ────────────────────────────────────────────────────────
-- Reserva de pontos de lotes específicos para um resgate pendente
create table loyalty.lot_reservations (
  id              uuid        primary key default uuid_generate_v4(),
  lot_id          uuid        not null references loyalty.point_lots(id) on delete restrict,
  intent_id       uuid        not null,   -- FK para redemption.discount_redemption_intents, adicionada depois
  points_reserved integer     not null check (points_reserved > 0),
  created_at      timestamptz not null default now()
);

create index reservations_lot_idx    on loyalty.lot_reservations(lot_id);
create index reservations_intent_idx on loyalty.lot_reservations(intent_id);
