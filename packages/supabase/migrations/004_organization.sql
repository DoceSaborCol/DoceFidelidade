-- =============================================================================
-- 004_organization.sql
-- Organizações, lojas, membros da equipe, papéis e permissões
-- =============================================================================

-- ─── organizations ───────────────────────────────────────────────────────────
create table org.organizations (
  id              uuid    primary key default uuid_generate_v4(),
  slug            text    unique not null check (slug ~ '^[a-z0-9-]+$'),
  name            text    not null,
  legal_name      text,
  cnpj            text    unique,
  status          text    not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Loja piloto será inserida via seed
comment on table org.organizations is 'Organização / rede / franqueador';

-- ─── stores ──────────────────────────────────────────────────────────────────
create table org.stores (
  id                  uuid    primary key default uuid_generate_v4(),
  organization_id     uuid    not null references org.organizations(id) on delete restrict,
  slug                text    not null check (slug ~ '^[a-z0-9-]+$'),
  name                text    not null,
  cnpj                text    not null,
  ie                  text,   -- inscrição estadual
  -- Endereço
  address_street      text,
  address_number      text,
  address_district    text,
  address_city        text    not null default 'Colatina',
  address_state       char(2) not null default 'ES',
  address_zip         text,
  -- Contato
  phone               text,
  instagram_handle    text,
  timezone            text    not null default 'America/Sao_Paulo',
  -- Estado
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (organization_id, slug)
);

create index stores_org_idx on org.stores(organization_id);

-- FK deferred: customers.preferred_store_id → stores
alter table identity.customers
  add constraint customers_preferred_store_fk
  foreign key (preferred_store_id) references org.stores(id)
  on delete set null
  deferrable initially deferred;

-- ─── admins ──────────────────────────────────────────────────────────────────
-- Perfil administrativo (separado de identity.customers)
create table org.admins (
  id              uuid    primary key default uuid_generate_v4(),
  auth_user_id    uuid    unique references auth.users(id) on delete restrict,
  full_name       text    not null,
  email           text    unique not null,
  is_platform_admin boolean not null default false,  -- admin global da plataforma
  mfa_enrolled    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- FK privacy_requests.handled_by
alter table identity.privacy_requests
  add constraint privacy_requests_admin_fk
  foreign key (handled_by) references org.admins(id)
  on delete set null;

-- ─── organization_memberships ─────────────────────────────────────────────────
create table org.organization_memberships (
  id                  uuid                primary key default uuid_generate_v4(),
  organization_id     uuid                not null references org.organizations(id) on delete cascade,
  admin_id            uuid                not null references org.admins(id) on delete cascade,
  role                org.member_role     not null,
  status              org.member_status   not null default 'invited',
  invited_by          uuid                references org.admins(id) on delete set null,
  invited_at          timestamptz         not null default now(),
  approved_at         timestamptz,
  suspended_at        timestamptz,
  suspension_reason   text,

  unique (organization_id, admin_id)
);

create index memberships_org_idx    on org.organization_memberships(organization_id, status);
create index memberships_admin_idx  on org.organization_memberships(admin_id);

-- ─── store_memberships ────────────────────────────────────────────────────────
-- Um admin pode operar em uma ou mais lojas específicas
create table org.store_memberships (
  id          uuid    primary key default uuid_generate_v4(),
  store_id    uuid    not null references org.stores(id) on delete cascade,
  admin_id    uuid    not null references org.admins(id) on delete cascade,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),

  unique (store_id, admin_id)
);

-- ─── permissions ─────────────────────────────────────────────────────────────
-- Permissões granulares disponíveis no sistema
create table org.permissions (
  code        text    primary key,  -- ex: 'customers:read', 'points:adjust', 'team:manage'
  description text    not null,
  category    text    not null      -- ex: 'customers', 'loyalty', 'team', 'config'
);

-- ─── role_permissions ─────────────────────────────────────────────────────────
-- Mapeamento de papéis → permissões (configurável por organização)
create table org.role_permissions (
  id                  uuid    primary key default uuid_generate_v4(),
  organization_id     uuid    not null references org.organizations(id) on delete cascade,
  role                org.member_role not null,
  permission_code     text    not null references org.permissions(code) on delete cascade,

  unique (organization_id, role, permission_code)
);

-- ─── member_permission_overrides ──────────────────────────────────────────────
-- Permissões individuais adicionadas ou removidas para um membro específico
create table org.member_permission_overrides (
  id              uuid    primary key default uuid_generate_v4(),
  membership_id   uuid    not null references org.organization_memberships(id) on delete cascade,
  permission_code text    not null references org.permissions(code) on delete cascade,
  granted         boolean not null,  -- true = adicionar, false = remover
  granted_by      uuid    references org.admins(id) on delete set null,
  reason          text,
  created_at      timestamptz not null default now(),

  unique (membership_id, permission_code)
);
