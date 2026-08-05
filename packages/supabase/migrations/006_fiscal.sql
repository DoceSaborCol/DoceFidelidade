-- =============================================================================
-- 006_fiscal.sql
-- Notas fiscais NFC-e: scans, validações, antifraude
-- =============================================================================

-- ─── scanned_invoices ────────────────────────────────────────────────────────
create table fiscal.scanned_invoices (
  id                      uuid                    primary key default uuid_generate_v4(),
  customer_id             uuid                    not null references identity.customers(id) on delete restrict,
  store_id                uuid                    references org.stores(id) on delete set null,

  -- Chave de acesso (44 dígitos) — indexada para unicidade
  access_key              char(44)                not null,
  access_key_masked       text                    not null,  -- primeiros/últimos 4 dígitos visíveis

  -- Dados da nota (preenchidos após validação)
  invoice_model           text,           -- '65' para NFC-e
  invoice_uf              char(2),
  emitter_cnpj            text,
  invoice_number          text,
  invoice_series          text,
  issued_at               timestamptz,
  total_cents             integer,        -- valor total em centavos
  eligible_cents          integer,        -- valor elegível para pontos
  recipient_cpf_last4     char(4),        -- sufixo mascarado do CPF destinatário

  -- Protocolo e autorização
  authorization_protocol  text,
  emission_type           text,           -- '1' normal, '9' contingência

  -- Estado
  status                  fiscal.invoice_status   not null default 'received',
  rejection_reason        fiscal.rejection_reason,
  rejection_details       text,
  validation_source       fiscal.validation_source,

  -- Pontos gerados
  points_earned           integer         default 0,
  rule_id                 uuid            references loyalty.loyalty_rules(id) on delete set null,
  lot_id                  uuid,           -- FK para loyalty.point_lots adicionada depois

  -- Rastreabilidade
  scanned_at              timestamptz     not null default now(),
  validated_at            timestamptz,
  public_code             text            unique,  -- DSP-YYYYMMDD-NNNNN

  -- Dispositivo / sessão
  device_id               text,
  ip_masked               text,
  idempotency_key         text            unique,

  -- Unique: uma chave por organização
  unique (access_key, customer_id)
);

comment on table fiscal.scanned_invoices is 'Registro de QR NFC-e escaneados pelo cliente';
comment on column fiscal.scanned_invoices.access_key is '44 dígitos da chave de acesso NFC-e — indexada para detecção de duplicidade';
comment on column fiscal.scanned_invoices.eligible_cents is 'Valor elegível = total - itens não elegíveis (calculado pela regra)';

create unique index invoices_key_idx         on fiscal.scanned_invoices(access_key);  -- unicidade global da chave
create index invoices_customer_idx          on fiscal.scanned_invoices(customer_id, scanned_at desc);
create index invoices_status_idx            on fiscal.scanned_invoices(status, scanned_at desc);
create index invoices_store_idx             on fiscal.scanned_invoices(store_id, scanned_at desc);
create index invoices_emitter_cnpj_idx      on fiscal.scanned_invoices(emitter_cnpj);

-- FKs adicionadas após criação de loyalty.point_lots
alter table fiscal.scanned_invoices
  add constraint invoices_lot_fk
  foreign key (lot_id) references loyalty.point_lots(id)
  on delete set null
  deferrable initially deferred;

alter table loyalty.point_lots
  add constraint lots_invoice_fk
  foreign key (invoice_id) references fiscal.scanned_invoices(id)
  on delete set null
  deferrable initially deferred;

alter table loyalty.point_transactions
  add constraint txn_invoice_fk
  foreign key (invoice_id) references fiscal.scanned_invoices(id)
  on delete set null
  deferrable initially deferred;

-- ─── invoice_validation_attempts ─────────────────────────────────────────────
-- Histórico de cada tentativa de validação (retries, providers)
create table fiscal.invoice_validation_attempts (
  id              uuid                        primary key default uuid_generate_v4(),
  invoice_id      uuid                        not null references fiscal.scanned_invoices(id) on delete cascade,
  attempt_number  smallint                    not null default 1,
  source          fiscal.validation_source    not null,
  started_at      timestamptz                 not null default now(),
  completed_at    timestamptz,
  success         boolean,
  http_status     smallint,
  error_code      text,
  response_time_ms integer,
  -- Resposta sanitizada (sem dados fiscais sensíveis em claro)
  result_summary  jsonb
);

create index validation_attempts_invoice_idx on fiscal.invoice_validation_attempts(invoice_id, started_at desc);

-- ─── invoice_risk_signals ────────────────────────────────────────────────────
-- Sinais de risco antifraude detectados durante ou após validação
create table fiscal.invoice_risk_signals (
  id              uuid        primary key default uuid_generate_v4(),
  invoice_id      uuid        not null references fiscal.scanned_invoices(id) on delete cascade,
  signal_type     text        not null,   -- ex: 'velocity_high', 'emitter_mismatch', 'recipient_mismatch'
  severity        text        not null check (severity in ('low', 'medium', 'high', 'critical')),
  details         jsonb,
  detected_at     timestamptz not null default now(),
  reviewed_by     uuid        references org.admins(id) on delete set null,
  reviewed_at     timestamptz,
  resolution      text        -- 'accepted_risk', 'false_positive', 'confirmed_fraud'
);

create index risk_signals_invoice_idx   on fiscal.invoice_risk_signals(invoice_id);
create index risk_signals_severity_idx  on fiscal.invoice_risk_signals(severity, detected_at desc);
