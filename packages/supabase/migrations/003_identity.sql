-- =============================================================================
-- 003_identity.sql
-- Tabelas de identidade: clientes, contatos, sessões, consentimentos, privacidade
-- =============================================================================

-- ─── customers ───────────────────────────────────────────────────────────────
-- Perfil público do cliente (separado de auth.users para flexibilidade)
create table identity.customers (
  id                  uuid        primary key default uuid_generate_v4(),
  auth_user_id        uuid        unique references auth.users(id) on delete set null,

  -- Identificação
  full_name           text        not null check (char_length(full_name) between 2 and 120),
  display_name        text        generated always as (split_part(full_name, ' ', 1)) stored,

  -- Contatos (desnormalizados para leitura rápida — fonte de verdade em contact_points)
  email               text        unique,
  phone               text        unique,
  cpf_hash            text        unique,  -- bcrypt hash, nunca o CPF em claro
  cpf_last4           char(4),             -- sufixo para exibição mascarada

  -- Dados pessoais opcionais
  birth_date          date,
  preferred_store_id  uuid,       -- FK adicionada após criação de stores

  -- Estado
  status              identity.customer_status not null default 'pending_verification',
  blocked_at          timestamptz,
  blocked_reason      text,
  deleted_at          timestamptz,  -- soft delete

  -- Origem e tracking
  acquisition_source  text,         -- 'organic', 'referral', 'instagram', 'import', etc.
  referrer_id         uuid references identity.customers(id) on delete set null,
  legacy_id           text,         -- identificador no sistema Fidelize legado

  -- Metadados
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table identity.customers is 'Perfil do cliente no programa de fidelidade';
comment on column identity.customers.cpf_hash is 'Hash bcrypt do CPF — nunca armazenar o CPF em claro';
comment on column identity.customers.legacy_id is 'Identificador no Fidelize — NÃO usar como identidade atual';

create index customers_email_idx        on identity.customers(email) where email is not null;
create index customers_phone_idx        on identity.customers(phone) where phone is not null;
create index customers_status_idx       on identity.customers(status);
create index customers_legacy_id_idx    on identity.customers(legacy_id) where legacy_id is not null;
create index customers_birth_date_idx   on identity.customers(birth_date) where birth_date is not null;
create index customers_created_at_idx   on identity.customers(created_at desc);
create index customers_name_trgm_idx    on identity.customers using gin(full_name gin_trgm_ops);

-- ─── customer_contact_points ─────────────────────────────────────────────────
-- Múltiplos contatos por cliente com estado de verificação
create table identity.customer_contact_points (
  id              uuid                        primary key default uuid_generate_v4(),
  customer_id     uuid                        not null references identity.customers(id) on delete cascade,
  contact_type    identity.contact_type       not null,
  value_hash      text                        not null,   -- hash do valor — nunca em claro
  value_masked    text                        not null,   -- ex: "****@gmail.com", "+55 (27) ****-1234"
  is_primary      boolean                     not null default false,
  status          identity.verification_status not null default 'pending',
  verified_at     timestamptz,
  created_at      timestamptz                 not null default now(),

  unique (contact_type, value_hash)
);

create index contact_points_customer_idx on identity.customer_contact_points(customer_id);

-- ─── otp_attempts ────────────────────────────────────────────────────────────
-- Controle de tentativas de OTP (rate limiting persistente)
create table identity.otp_attempts (
  id              uuid        primary key default uuid_generate_v4(),
  customer_id     uuid        references identity.customers(id) on delete cascade,
  contact_hash    text        not null,  -- hash do contato tentado
  attempt_type    text        not null,  -- 'verify', 'login', 'recovery'
  ip_masked       text,
  success         boolean     not null default false,
  attempted_at    timestamptz not null default now()
);

create index otp_attempts_contact_idx   on identity.otp_attempts(contact_hash, attempted_at desc);
create index otp_attempts_customer_idx  on identity.otp_attempts(customer_id, attempted_at desc);

-- ─── consents ────────────────────────────────────────────────────────────────
-- Consentimentos versionados por cliente
create table identity.consents (
  id              uuid        primary key default uuid_generate_v4(),
  customer_id     uuid        not null references identity.customers(id) on delete cascade,
  consent_type    text        not null,   -- 'terms', 'privacy', 'marketing_email', 'marketing_push', etc.
  version         text        not null,   -- ex: '2026-01-01'
  granted         boolean     not null,
  granted_at      timestamptz not null default now(),
  revoked_at      timestamptz,
  ip_masked       text,
  user_agent      text,

  -- Versão ativa de cada tipo por cliente
  unique (customer_id, consent_type, version)
);

comment on table identity.consents is 'Consentimentos LGPD versionados — append-only por design';
create index consents_customer_idx on identity.consents(customer_id, consent_type);

-- ─── privacy_requests ────────────────────────────────────────────────────────
create table identity.privacy_requests (
  id              uuid                              primary key default uuid_generate_v4(),
  public_code     text                              unique not null,  -- DSRQ-YYYY-NNNNNN
  customer_id     uuid                              not null references identity.customers(id) on delete restrict,
  request_type    identity.privacy_request_type     not null,
  status          identity.privacy_request_status   not null default 'pending',
  details         text,
  response        text,
  handled_by      uuid,   -- FK para admins, adicionada depois
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  completed_at    timestamptz,
  deadline_at     timestamptz not null default (now() + interval '15 days')
);

create index privacy_requests_customer_idx on identity.privacy_requests(customer_id);
create index privacy_requests_status_idx   on identity.privacy_requests(status);
