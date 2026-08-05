-- =============================================================================
-- 009_config_comms_audit_legacy.sql
-- Configurações, notificações, auditoria append-only e legado
-- =============================================================================

-- ─── store_settings ──────────────────────────────────────────────────────────
-- ÚNICA fonte de verdade para parâmetros operacionais (nunca hardcodar no código)
create table config.store_settings (
  id              uuid    primary key default uuid_generate_v4(),
  store_id        uuid    unique not null references org.stores(id) on delete cascade,

  -- Dados da loja
  display_name    text,
  logo_url        text,

  -- Fiscal (CSC fica no Vault — aqui só referência)
  nfce_csc_id     text,
  nfce_csc_vault_ref text,  -- referência ao secret no Supabase Vault
  nfce_ambiente   text    not null default 'homologacao'
                  check (nfce_ambiente in ('homologacao', 'producao')),
  nfce_provider_url text,
  nfce_timeout_ms integer not null default 8000,
  nfce_max_age_hours integer not null default 72,

  -- Integrações (referências, não chaves em claro)
  resend_from_email    text,
  resend_from_name     text,
  firebase_project_id  text,
  whatsapp_phone_id    text,
  instagram_handle     text,

  -- Fuso
  timezone        text    not null default 'America/Sao_Paulo',

  -- Auditoria
  updated_by      uuid    references org.admins(id) on delete set null,
  updated_at      timestamptz not null default now()
);

comment on column config.store_settings.nfce_csc_vault_ref is
  'Referência ao secret no Supabase Vault — NUNCA armazenar o CSC em claro aqui';

-- ─── app_feature_flags ────────────────────────────────────────────────────────
create table config.app_feature_flags (
  id              uuid    primary key default uuid_generate_v4(),
  organization_id uuid    not null references org.organizations(id) on delete cascade,
  flag_key        text    not null,   -- ex: 'nfce_earn', 'vip_program', 'referral', 'instagram_bonus'
  enabled         boolean not null default false,
  config          jsonb,              -- parâmetros adicionais da flag
  updated_by      uuid    references org.admins(id) on delete set null,
  updated_at      timestamptz not null default now(),

  unique (organization_id, flag_key)
);

comment on table config.app_feature_flags is 'Kill switches e feature flags — usados para ativar/desativar módulos sem deploy';

-- ─── notifications ────────────────────────────────────────────────────────────
create table comms.notifications (
  id              uuid                        primary key default uuid_generate_v4(),
  customer_id     uuid                        not null references identity.customers(id) on delete cascade,
  organization_id uuid                        not null references org.organizations(id) on delete cascade,

  notification_type comms.notification_type   not null,
  title           text                        not null,
  body            text                        not null,
  image_url       text,
  action_url      text,
  metadata        jsonb,

  -- Estado de leitura
  read_at         timestamptz,
  created_at      timestamptz                 not null default now()
);

create index notifications_customer_idx on comms.notifications(customer_id, created_at desc);
create index notifications_unread_idx   on comms.notifications(customer_id) where read_at is null;

-- ─── notification_deliveries ──────────────────────────────────────────────────
create table comms.notification_deliveries (
  id              uuid                        primary key default uuid_generate_v4(),
  notification_id uuid                        not null references comms.notifications(id) on delete cascade,
  channel         comms.notification_channel  not null,
  status          comms.delivery_status       not null default 'pending',
  provider_id     text,           -- ID retornado pelo provedor (Resend, FCM, Meta)
  attempt_count   smallint        not null default 0,
  last_attempt_at timestamptz,
  delivered_at    timestamptz,
  error_detail    text,           -- sanitizado, sem PII
  created_at      timestamptz     not null default now()
);

create index deliveries_notification_idx on comms.notification_deliveries(notification_id);
create index deliveries_status_idx       on comms.notification_deliveries(status, last_attempt_at asc);

-- ─── notification_preferences ─────────────────────────────────────────────────
create table comms.notification_preferences (
  id              uuid    primary key default uuid_generate_v4(),
  customer_id     uuid    unique not null references identity.customers(id) on delete cascade,

  -- Marketing (opt-in/opt-out)
  push_marketing      boolean not null default true,
  email_marketing     boolean not null default true,
  whatsapp_marketing  boolean not null default false,

  -- Operacionais (sempre ativos — não desativáveis pelo cliente)
  -- Registrar aqui apenas para fins de histórico e auditoria
  push_operational    boolean not null default true,
  email_operational   boolean not null default true,

  updated_at      timestamptz not null default now()
);

-- ─── device_tokens ────────────────────────────────────────────────────────────
create table comms.device_tokens (
  id              uuid    primary key default uuid_generate_v4(),
  customer_id     uuid    not null references identity.customers(id) on delete cascade,
  token_hash      text    not null unique,  -- hash do token FCM
  platform        text    not null check (platform in ('ios', 'android', 'web')),
  is_active       boolean not null default true,
  last_seen_at    timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index device_tokens_customer_idx on comms.device_tokens(customer_id, is_active);

-- ─── audit_events ─────────────────────────────────────────────────────────────
-- Append-only — NENHUM UPDATE ou DELETE permitido
create table audit.audit_events (
  id              uuid        primary key default uuid_generate_v4(),
  event_type      text        not null,   -- ex: 'login', 'points.adjust', 'redemption.confirm'
  event_version   text        not null default '1',
  occurred_at     timestamptz not null default now(),

  -- Contexto
  organization_id uuid        references org.organizations(id) on delete set null,
  store_id        uuid        references org.stores(id) on delete set null,
  actor_id        uuid,       -- UUID do admin ou cliente que realizou a ação
  actor_type      text,       -- 'customer', 'admin', 'system', 'support'
  entity_id       uuid,       -- entidade afetada
  entity_type     text,       -- 'customer', 'invoice', 'redemption', etc.

  -- Rastreabilidade
  request_id      text,
  correlation_id  text,
  ip_masked       text,
  user_agent      text,

  -- Resultado
  result          audit.event_result not null default 'success',
  reason          text,       -- motivo de falha ou justificativa

  -- Dados sanitizados (sem PII, sem secrets)
  metadata        jsonb
);

comment on table audit.audit_events is 'Trilha de auditoria append-only — nunca alterar ou excluir registros';

create index audit_events_org_idx       on audit.audit_events(organization_id, occurred_at desc);
create index audit_events_actor_idx     on audit.audit_events(actor_id, occurred_at desc);
create index audit_events_entity_idx    on audit.audit_events(entity_id, entity_type, occurred_at desc);
create index audit_events_type_idx      on audit.audit_events(event_type, occurred_at desc);
create index audit_events_occurred_idx  on audit.audit_events(occurred_at desc);

-- ─── outbox_events ────────────────────────────────────────────────────────────
-- Transactional outbox para eventos de domínio
create table audit.outbox_events (
  id              uuid        primary key default uuid_generate_v4(),
  event_type      text        not null,
  aggregate_type  text        not null,
  aggregate_id    uuid        not null,
  payload         jsonb       not null,
  published       boolean     not null default false,
  published_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index outbox_unpublished_idx on audit.outbox_events(created_at asc) where not published;

-- ─── legacy tables ────────────────────────────────────────────────────────────

create table legacy.import_batches (
  id              uuid                        primary key default uuid_generate_v4(),
  organization_id uuid                        not null references org.organizations(id) on delete restrict,
  file_name       text                        not null,
  file_hash       text                        not null,  -- SHA-256 do arquivo original
  file_size_bytes bigint                      not null,
  source_system   text                        not null default 'fidelize',
  status          legacy.import_status        not null default 'pending',
  dry_run         boolean                     not null default true,
  total_rows      integer,
  new_count       integer,
  exact_count     integer,
  probable_count  integer,
  ambiguous_count integer,
  invalid_count   integer,
  duplicate_count integer,
  imported_count  integer,
  initiated_by    uuid                        not null references org.admins(id) on delete restrict,
  authorized_by   uuid                        references org.admins(id) on delete set null,
  created_at      timestamptz                 not null default now(),
  updated_at      timestamptz                 not null default now()
);

create table legacy.customer_profiles (
  id                      uuid                            primary key default uuid_generate_v4(),
  batch_id                uuid                            not null references legacy.import_batches(id) on delete restrict,
  -- Dados originais (preservados como importados — snapshot imutável)
  raw_data                jsonb                           not null,
  -- Dados normalizados (para matching)
  normalized_phone        text,
  normalized_email        text,
  normalized_cpf_hash     text,
  legacy_id               text,           -- ID no Fidelize
  -- Classificação
  classification          legacy.record_classification    not null,
  matched_customer_id     uuid            references identity.customers(id) on delete set null,
  match_confidence        numeric(5,2),   -- 0-100
  match_notes             text,
  -- Saldo legado
  legacy_points           integer         not null default 0 check (legacy_points >= 0),
  created_at              timestamptz     not null default now()
);

create table legacy.customer_claims (
  id                  uuid                    primary key default uuid_generate_v4(),
  profile_id          uuid                    unique not null references legacy.customer_profiles(id) on delete restrict,
  customer_id         uuid                    not null references identity.customers(id) on delete restrict,
  status              legacy.claim_status     not null default 'pending',
  points_to_grant     integer                 not null check (points_to_grant >= 0),
  granted_transaction_id uuid                 references loyalty.point_transactions(id) on delete set null,
  decided_by          uuid                    not null references org.admins(id) on delete restrict,
  decided_at          timestamptz,
  decision_notes      text,
  created_at          timestamptz             not null default now()
);

comment on table legacy.customer_claims is
  'Vinculação entre perfil legado e cliente atual — saldo concedido no máximo uma vez';

create unique index claims_approved_once
  on legacy.customer_claims(profile_id)
  where status = 'approved';  -- garante concessão única
