-- =============================================================================
-- 002_enums.sql
-- Tipos enumerados do sistema — centralizar aqui evita magic strings
-- =============================================================================

-- ─── Identidade ──────────────────────────────────────────────────────────────

create type identity.customer_status as enum (
  'pending_verification',  -- cadastrado, aguardando verificação de contato
  'active',                -- verificado e operacional
  'blocked',               -- bloqueado por fraude ou política
  'deleted'                -- exclusão solicitada (soft delete)
);

create type identity.contact_type as enum (
  'email',
  'phone',
  'cpf'
);

create type identity.verification_status as enum (
  'pending',
  'verified',
  'expired',
  'failed'
);

create type identity.privacy_request_type as enum (
  'data_export',      -- portabilidade
  'data_correction',  -- retificação
  'data_deletion',    -- exclusão
  'opt_out'           -- retirada de consentimento
);

create type identity.privacy_request_status as enum (
  'pending',
  'in_progress',
  'completed',
  'rejected',
  'expired'
);

-- ─── Organização ─────────────────────────────────────────────────────────────

create type org.member_role as enum (
  'owner',
  'manager',
  'cashier',
  'support',
  'viewer'
);

create type org.member_status as enum (
  'invited',
  'active',
  'suspended',
  'rejected'
);

-- ─── Fiscal ──────────────────────────────────────────────────────────────────

create type fiscal.invoice_status as enum (
  'received',             -- QR escaneado, aguardando processamento
  'pending',              -- na fila de validação
  'validating',           -- consultando fonte fiscal
  'approved',             -- validada, pontos creditados
  'rejected',             -- rejeitada com motivo
  'duplicate',            -- chave já utilizada
  'canceled',             -- cancelada pela SEFAZ após aprovação inicial
  'manual_review',        -- encaminhada para revisão humana
  'provider_unavailable'  -- fonte fiscal indisponível, aguardando retry
);

create type fiscal.rejection_reason as enum (
  'invalid_qr',
  'invalid_key',
  'wrong_model',          -- não é modelo 65 (NFC-e)
  'wrong_emitter',        -- CNPJ não pertence à loja
  'canceled_invoice',
  'unauthorized_invoice',
  'recipient_mismatch',   -- CPF do destinatário não corresponde ao cliente
  'already_used',
  'expired',              -- nota mais antiga que o limite configurado
  'below_minimum_value',
  'rate_limit_exceeded',
  'provider_unavailable',
  'invalid_csc',
  'insufficient_evidence',
  'fraud_signal'
);

create type fiscal.validation_source as enum (
  'authorized_provider',  -- provedor fiscal homologado (produção)
  'issuer_api',           -- API do emissor
  'official_webservice',  -- webservice SEFAZ
  'manual'                -- aprovação manual pelo administrador
);

-- ─── Pontos / Loyalty ────────────────────────────────────────────────────────

create type loyalty.transaction_type as enum (
  'earn',        -- pontos gerados por compra
  'bonus',       -- bônus de campanha, indicação, Instagram etc.
  'import',      -- saldo migrado do sistema legado
  'redeem',      -- consumo em resgate confirmado
  'reserve',     -- reserva para resgate pendente
  'release',     -- liberação de reserva (cancelamento)
  'expire',      -- expiração de lote
  'reverse',     -- estorno compensatório (ação administrativa)
  'adjustment'   -- ajuste manual justificado
);

create type loyalty.lot_status as enum (
  'active',    -- pontos disponíveis neste lote
  'depleted',  -- lote esgotado (pontos = 0)
  'expired'    -- lote expirado pela política de validade
);

-- ─── Resgate ─────────────────────────────────────────────────────────────────

create type redemption.intent_status as enum (
  'pending',    -- reservado, aguardando confirmação do caixa
  'confirmed',  -- confirmado, pontos consumidos
  'released',   -- cancelado pelo cliente ou expirado (pontos liberados)
  'expired'     -- TTL expirado sem confirmação
);

create type redemption.reward_status as enum (
  'draft',
  'scheduled',
  'active',
  'paused',
  'expired',
  'archived'
);

create type redemption.reward_type as enum (
  'discount_points',  -- desconto em reais usando pontos
  'product',          -- produto específico
  'gift',             -- brinde
  'voucher',          -- voucher externo
  'experience'        -- experiência (ex: tour, evento)
);

-- ─── Promoções ───────────────────────────────────────────────────────────────

create type promo.campaign_status as enum (
  'draft',
  'scheduled',
  'active',
  'paused',
  'ended',
  'archived'
);

create type promo.coupon_status as enum (
  'available',
  'reserved',
  'used',
  'expired',
  'canceled',
  'unavailable'
);

create type promo.coupon_type as enum (
  'fixed_discount',       -- desconto fixo em reais
  'percentage_discount',  -- desconto percentual
  'free_product',         -- produto gratuito
  'discounted_product',   -- produto com desconto
  'bonus_points',         -- pontos extras
  'special_benefit'       -- benefício especial
);

-- ─── Notificações ────────────────────────────────────────────────────────────

create type comms.notification_type as enum (
  'account_created',
  'security_alert',
  'points_earned',
  'points_expiring',
  'new_reward',
  'coupon_available',
  'coupon_expiring',
  'campaign',
  'redemption_update',
  'privacy_request_update'
);

create type comms.notification_channel as enum (
  'push',
  'in_app',
  'email',
  'whatsapp',
  'sms'
);

create type comms.delivery_status as enum (
  'pending',
  'sent',
  'delivered',
  'failed',
  'dead_letter'
);

-- ─── Auditoria ───────────────────────────────────────────────────────────────

create type audit.event_result as enum (
  'success',
  'failure',
  'partial'
);

-- ─── Legado ──────────────────────────────────────────────────────────────────

create type legacy.import_status as enum (
  'pending',          -- aguardando processamento
  'dry_run',          -- análise sem efetivação
  'awaiting_review',  -- aguardando revisão do proprietário
  'importing',        -- sendo importado
  'completed',        -- concluído
  'failed',           -- falhou
  'rolled_back'       -- revertido (lançamento compensatório)
);

create type legacy.record_classification as enum (
  'new_customer',         -- sem correspondência — criar novo
  'exact_match',          -- correspondência exata (telefone + email)
  'probable_match',       -- correspondência provável (1 identificador)
  'ambiguous',            -- múltiplos candidatos — revisão humana
  'invalid',              -- dados insuficientes ou corrompidos
  'duplicate',            -- duplicata dentro do próprio arquivo
  'blocked',              -- cliente bloqueado — não importar
  'pending_review'        -- aguardando decisão do proprietário
);

create type legacy.claim_status as enum (
  'pending',    -- aguardando análise
  'approved',   -- vínculo aprovado, saldo concedido
  'rejected',   -- rejeitado (ambíguo, fraude etc.)
  'reversed'    -- revertido por lançamento compensatório
);
