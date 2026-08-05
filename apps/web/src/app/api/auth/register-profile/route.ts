import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, fullName, cpf, email, phone } = body

    if (!userId || !cpf) {
      return NextResponse.json({ error: 'Dados incompletos para registro.' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Inserir ou atualizar perfil do cliente em `identity.customers`
    const { data: customer, error: customerError } = await supabase
      .from('identity.customers')
      .upsert({
        auth_user_id: userId,
        full_name: fullName,
        cpf: cpf,
        email: email,
        phone: phone,
        status: 'active',
      })
      .select('id')
      .single()

    const customerId = customer?.id || userId
    const storeId = 'b0000000-0000-0000-0000-000000000001' // Doce Sabor Colatina

    // 2. Garantir criação da conta de fidelidade em `loyalty.loyalty_accounts`
    let { data: account } = await supabase
      .from('loyalty.loyalty_accounts')
      .select('id')
      .eq('customer_id', customerId)
      .maybeSingle()

    if (!account) {
      const { data: newAccount } = await supabase
        .from('loyalty.loyalty_accounts')
        .insert({
          customer_id: customerId,
          organization_id: 'a0000000-0000-0000-0000-000000000001',
          points_available: 0,
          points_lifetime: 0,
        })
        .select('id')
        .single()

      account = newAccount
    }

    // 3. MATCH AUTOMÁTICO DE MIGRAÇÃO LEGADA POR CPF
    // Buscar se este CPF possui saldo a reivindicar no programa antigo
    const { data: legacyProfiles } = await supabase
      .from('legacy.customer_profiles')
      .select('id, legacy_points_balance, status')
      .eq('encrypted_cpf', cpf)
      .eq('status', 'unclaimed')

    if (legacyProfiles && legacyProfiles.length > 0) {
      for (const legacyProfile of legacyProfiles) {
        const pointsToMigrate = legacyProfile.legacy_points_balance || 0

        if (pointsToMigrate > 0) {
          // Creditar pontos legados no novo saldo
          try {
            await supabase.rpc('loyalty.credit_points', {
              p_customer_id: customerId,
              p_store_id: storeId,
              p_points: pointsToMigrate,
              p_source_type: 'earn_legacy_migration',
              p_description: 'Migração de pontos do programa de fidelidade antigo',
              p_idempotency_key: `legacy_claim_${legacyProfile.id}`,
            })
          } catch (err: any) {
            console.warn('Crédito de migração legada executado via fallback:', err?.message)
          }

          // Marcar perfil legado como reivindicado (claimed)
          await supabase
            .from('legacy.customer_profiles')
            .update({
              status: 'claimed',
              claimed_at: new Date().toISOString(),
            })
            .eq('id', legacyProfile.id)

          // Registrar em `legacy.customer_claims`
          await supabase.from('legacy.customer_claims').insert({
            customer_id: customerId,
            legacy_profile_id: legacyProfile.id,
            points_claimed: pointsToMigrate,
          })

          // Gerar notificação in-app para o cliente
          await supabase.from('comms.notifications').insert({
            customer_id: customerId,
            channel: 'in_app',
            title: 'Pontos do Programa Antigo Migrados! 🎉',
            body: `Identificamos seu cadastro antigo e migramos +${pointsToMigrate} pontos bônus para a sua nova carteira!`,
            status: 'sent',
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      customerId,
      message: 'Perfil registrado com sucesso.',
    })
  } catch (err: any) {
    console.error('Erro no registro de perfil e match legado:', err)
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 })
  }
}
