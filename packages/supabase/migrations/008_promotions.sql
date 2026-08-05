-- =============================================================================
-- 008_promotions.sql
-- Promoções, campanhas, cupons
-- =============================================================================

-- ─── promotions ──────────────────────────────────────────────────────────────
create table promo.promotions (
  id                  uuid    primary key default uuid_generate_v4(),
  organization_id     uuid    not null references org.organizations(id) on delete restrict,

  name                text    not null,
  description         text,
  objective           text,   -- 'reactivate', 'increase_frequency', 'birthday', etc.

  -- Período
  starts_at           timestamptz not null,
  ends_at             timestamptz,

  -- Benefício
  multiplier          numeric(4,2) not null default 1.0 check (multiplier > 0),
  bonus_points        integer not null default 0 check (bonus_points >= 0),
  max_points_per_customer integer,  -- null = sem limite

  -- Elegibilidade
  min_purchase_cents  integer not null default 0,
  applicable_stores   uuid[], -- null = todas as lojas
  applicable_days     integer[], -- 0-6 (domingo-sábado), null = todos os dias
  applicable_hours_start time,
  applicable_hours_end   time,

  -- Orçamento
  budget_cents        integer,    -- custo máximo estimado
  spent_cents         integer     not null default 0,

  -- Estado
  status              promo.campaign_status not null default 'draft',
  is_active           boolean     not null generated always as (status = 'active') stored,

  -- Auditoria
  created_by          uuid    references org.admins(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table promo.promotions is 'Promoções de multiplicador de pontos — regras não são alteradas retroativamente';
create index promotions_org_idx     on promo.promotions(organization_id, status);
create index promotions_period_idx  on promo.promotions(starts_at, ends_at) where status = 'active';

-- ─── campaigns ───────────────────────────────────────────────────────────────
create table promo.campaigns (
  id                  uuid    primary key default uuid_generate_v4(),
  organization_id     uuid    not null references org.organizations(id) on delete restrict,

  name                text    not null,
  description         text,
  objective           text,

  -- Período
  starts_at           timestamptz not null,
  ends_at             timestamptz,

  -- Estado
  status              promo.campaign_status not null default 'draft',

  -- Segmentação (armazenada como JSONB para flexibilidade)
  audience_criteria   jsonb,  -- {active: bool, vip_level: str, min_balance: int, etc.}
  estimated_audience  integer,

  -- Métricas (atualizadas por jobs)
  reached_count       integer not null default 0,
  activated_count     integer not null default 0,
  redeemed_count      integer not null default 0,
  revenue_cents       integer not null default 0,
  cost_cents          integer not null default 0,

  -- Comunicação
  send_push           boolean not null default true,
  send_email          boolean not null default false,
  send_whatsapp       boolean not null default false,
  message_title       text,
  message_body        text,

  -- Auditoria
  created_by          uuid    references org.admins(id) on delete set null,
  published_by        uuid    references org.admins(id) on delete set null,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- FK de point_lots e transactions → campaigns
alter table loyalty.point_lots
  add constraint lots_campaign_fk
  foreign key (campaign_id) references promo.campaigns(id)
  on delete set null
  deferrable initially deferred;

alter table loyalty.point_transactions
  add constraint txn_campaign_fk
  foreign key (campaign_id) references promo.campaigns(id)
  on delete set null
  deferrable initially deferred;

-- ─── coupons ─────────────────────────────────────────────────────────────────
create table promo.coupons (
  id                  uuid                    primary key default uuid_generate_v4(),
  campaign_id         uuid                    references promo.campaigns(id) on delete set null,
  organization_id     uuid                    not null references org.organizations(id) on delete restrict,
  store_id            uuid                    references org.stores(id) on delete set null,

  -- Conteúdo
  code                text                    not null,
  title               text                    not null,
  description         text,
  image_url           text,
  coupon_type         promo.coupon_type       not null,

  -- Valor do benefício
  discount_cents      integer,        -- para fixed_discount
  discount_percent    numeric(5,2),   -- para percentage_discount (0-100)
  bonus_points        integer,        -- para bonus_points

  -- Período
  starts_at           timestamptz     not null,
  ends_at             timestamptz,

  -- Regras de uso
  min_purchase_cents  integer         not null default 0,
  max_uses_global     integer,        -- null = ilimitado
  max_uses_per_customer integer       not null default 1,
  combinable          boolean         not null default false,

  -- Controle de uso
  used_count          integer         not null default 0 check (used_count >= 0),

  -- Lojas participantes
  applicable_stores   uuid[],  -- null = todas

  created_at          timestamptz     not null default now(),
  updated_at          timestamptz     not null default now()
);

create unique index coupons_code_org_idx on promo.coupons(code, organization_id);
create index coupons_org_idx on promo.coupons(organization_id, starts_at);

-- ─── coupon_assignments ───────────────────────────────────────────────────────
-- Associação de cupom a cliente específico
create table promo.coupon_assignments (
  id              uuid                    primary key default uuid_generate_v4(),
  coupon_id       uuid                    not null references promo.coupons(id) on delete cascade,
  customer_id     uuid                    not null references identity.customers(id) on delete cascade,
  status          promo.coupon_status     not null default 'available',
  assigned_at     timestamptz             not null default now(),
  expires_at      timestamptz,
  used_at         timestamptz,
  canceled_at     timestamptz,

  unique (coupon_id, customer_id)
);

create index coupon_assignments_customer_idx on promo.coupon_assignments(customer_id, status);
