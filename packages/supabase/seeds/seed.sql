-- =============================================================================
-- SEED INICIAL — DOCE SABOR COLATINA
-- =============================================================================

-- 1. Organização Principal
insert into org.organizations (id, slug, name, legal_name, cnpj)
values (
  'a0000000-0000-0000-0000-000000000001',
  'doce-sabor',
  'Doce Sabor',
  'Doce Sabor Sorvetes Soft LTDA',
  '02982922000177'
) on conflict (id) do nothing;

-- 2. Loja Piloto Colatina
insert into org.stores (id, organization_id, slug, name, cnpj, address_city, address_state, instagram_handle)
values (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'colatina',
  'Doce Sabor Colatina',
  '02982922000177',
  'Colatina',
  'ES',
  'docesaborcolatina'
) on conflict (id) do nothing;

-- 3. Regra de Pontuação Oficial de Referência (Contexto Mestre 7.10)
-- R$ 8,00 = 1 Ponto | 1 Ponto = R$ 1,00 de desconto
insert into loyalty.loyalty_rules (
  id, store_id, name, cents_per_point, min_purchase_cents,
  point_value_cents, min_redemption_points, expiry_policy
) values (
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'Regra Padrão Doce Sabor',
  800,  -- R$ 8,00 por ponto
  800,  -- Compra mínima R$ 8,00
  100,  -- 1 Ponto = R$ 1,00 desconto
  8,    -- Resgate mínimo 8 pontos (R$ 8,00)
  'annual'
) on conflict (id) do nothing;

-- 4. Recompensas Iniciais do Catálogo
insert into redemption.rewards (
  organization_id, store_id, reward_type, name, description, points_cost, discount_cents, status
) values
(
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'discount_points',
  'Desconto no Casquinha ou Cascão',
  'R$ 8,00 de desconto no seu sorvete soft em casquinha ou cascão',
  8,
  800,
  'active'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'discount_points',
  'Desconto no Milk-shake 500ml',
  'R$ 15,00 de desconto em qualquer sabor de milk-shake 500ml',
  15,
  1500,
  'active'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'discount_points',
  'Desconto no Açaí Especial',
  'R$ 20,00 de desconto na sua tigela de açaí especial',
  20,
  2000,
  'active'
);
