-- =============================================================================
-- 007_redemption.sql
-- Resgates: intenções, eventos, recompensas, inventário
-- =============================================================================

-- ─── discount_redemption_intents ─────────────────────────────────────────────
-- Uma intenção = uma solicitação de resgate por desconto
-- Consultar o token NÃO consome — apenas confirmar consome
create table redemption.discount_redemption_intents (
  id                  uuid                            primary key default uuid_generate_v4(),
  public_code         text                            unique not null,  -- DSR-YYYYMMDD-NNNNN
  account_id          uuid                            not null references loyalty.loyalty_accounts(id) on delete restrict,
  customer_id         uuid                            not null references identity.customers(id) on delete restrict,
  store_id            uuid                            references org.stores(id) on delete set null,
  organization_id     uuid                            not null references org.organizations(id) on delete restrict,

  -- Valor
  points_requested    integer                         not null check (points_requested > 0),
  discount_cents      integer                         not null check (discount_cents > 0),

  -- Token (assinado, não armazenar o token em claro — apenas o hash)
  token_hash          text                            not null unique,
  token_expires_at    timestamptz                     not null,

  -- Estado
  status              redemption.intent_status        not null default 'pending',

  -- Rastreabilidade
  confirmed_by        uuid                            references org.admins(id) on delete set null,
  confirmed_at        timestamptz,
  released_at         timestamptz,
  release_reason      text,   -- 'customer_canceled', 'expired', 'admin_canceled'

  -- Idempotência
  idempotency_key     text                            unique not null,

  -- Auditoria
  created_at          timestamptz                     not null default now(),
  updated_at          timestamptz                     not null default now()
);

comment on table redemption.discount_redemption_intents is
  'Intenção de resgate por desconto — consultar token NÃO consome, apenas confirmar consome';
comment on column redemption.discount_redemption_intents.token_hash is
  'Hash SHA-256 do token — nunca armazenar o token em claro';

-- Um cliente pode ter no máximo 1 resgate pending por organização
create unique index one_pending_per_customer
  on redemption.discount_redemption_intents(customer_id, organization_id)
  where status = 'pending';

create index intents_account_idx    on redemption.discount_redemption_intents(account_id, status);
create index intents_store_idx      on redemption.discount_redemption_intents(store_id, created_at desc);
create index intents_expires_idx    on redemption.discount_redemption_intents(token_expires_at) where status = 'pending';

-- FK de lot_reservations → intents (adicionada após criação de ambas as tabelas)
alter table loyalty.lot_reservations
  add constraint reservations_intent_fk
  foreign key (intent_id) references redemption.discount_redemption_intents(id)
  on delete restrict
  deferrable initially deferred;

-- FK de point_transactions → redemption
alter table loyalty.point_transactions
  add constraint txn_redemption_fk
  foreign key (redemption_id) references redemption.discount_redemption_intents(id)
  on delete set null
  deferrable initially deferred;

-- ─── discount_redemption_events ──────────────────────────────────────────────
-- Histórico de eventos de cada intenção (append-only)
create table redemption.discount_redemption_events (
  id              uuid        primary key default uuid_generate_v4(),
  intent_id       uuid        not null references redemption.discount_redemption_intents(id) on delete restrict,
  event_type      text        not null check (event_type in ('created', 'queried', 'confirmed', 'released', 'expired')),
  actor_id        uuid,       -- admin ou null (sistema)
  actor_type      text,       -- 'customer', 'cashier', 'system', 'admin'
  ip_masked       text,
  details         jsonb,
  occurred_at     timestamptz not null default now()
);

comment on table redemption.discount_redemption_events is 'Histórico append-only de eventos de resgate';
create index redemption_events_intent_idx on redemption.discount_redemption_events(intent_id, occurred_at asc);

-- ─── rewards ─────────────────────────────────────────────────────────────────
create table redemption.rewards (
  id                  uuid                        primary key default uuid_generate_v4(),
  organization_id     uuid                        not null references org.organizations(id) on delete restrict,
  store_id            uuid                        references org.stores(id) on delete set null,  -- null = todas as lojas

  -- Tipo e conteúdo
  reward_type         redemption.reward_type      not null,
  name                text                        not null,
  description         text,
  image_url           text,

  -- Custo
  points_cost         integer                     not null check (points_cost > 0),
  discount_cents      integer,  -- para reward_type = 'discount_points'

  -- Disponibilidade
  status              redemption.reward_status    not null default 'draft',
  starts_at           timestamptz,
  ends_at             timestamptz,
  display_order       integer                     not null default 0,

  -- Limites
  max_per_customer    integer,  -- null = sem limite
  max_total           integer,  -- null = sem limite
  min_purchase_cents  integer   not null default 0,

  -- Elegibilidade
  min_vip_level       text,     -- null = todos os níveis
  combinable          boolean   not null default true,

  -- Metadados
  created_by          uuid      references org.admins(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index rewards_org_idx    on redemption.rewards(organization_id, status);
create index rewards_store_idx  on redemption.rewards(store_id) where store_id is not null;

-- ─── reward_inventory ────────────────────────────────────────────────────────
-- Controle de estoque de recompensas (estoque nunca negativo)
create table redemption.reward_inventory (
  id              uuid        primary key default uuid_generate_v4(),
  reward_id       uuid        unique not null references redemption.rewards(id) on delete cascade,
  total_stock     integer,    -- null = ilimitado
  reserved_stock  integer     not null default 0 check (reserved_stock >= 0),
  used_stock      integer     not null default 0 check (used_stock >= 0),
  updated_at      timestamptz not null default now(),

  -- Garantir que estoque nunca fique negativo
  constraint stock_non_negative check (
    total_stock is null or (total_stock - reserved_stock - used_stock) >= 0
  )
);
