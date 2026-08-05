-- =============================================================================
-- 001_extensions_and_schemas.sql
-- Extensões necessárias e schemas de domínio
-- =============================================================================

-- Extensões
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "unaccent";
create extension if not exists "pg_trgm";  -- busca por similaridade

-- Schemas de domínio (separação clara de responsabilidades)
create schema if not exists identity;      -- clientes, admins, sessões, consentimentos
create schema if not exists org;           -- organizações, lojas, membros, papéis
create schema if not exists fiscal;        -- notas fiscais, validações, antifraude
create schema if not exists loyalty;       -- contas de pontos, lotes, transações, regras
create schema if not exists redemption;    -- intenções de resgate, eventos, recompensas
create schema if not exists promo;         -- promoções, campanhas, cupons
create schema if not exists comms;         -- notificações, preferências, tokens de push
create schema if not exists config;        -- configurações de loja, feature flags, integrações
create schema if not exists audit;         -- eventos de auditoria, domain events, outbox
create schema if not exists legacy;        -- importação, claims, saldos legados

-- Expor schemas relevantes via API Supabase
-- (apenas os que o cliente pode acessar via PostgREST)
-- Os demais ficam restritos ao service role e RPCs
