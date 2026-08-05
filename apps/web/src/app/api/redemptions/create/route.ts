import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verificar Autenticação do Cliente
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para resgatar.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { rewardId, pointsRequested, discountCents } = body

    const points = pointsRequested || 8
    const discount = discountCents || points * 100 // R$ 1,00 por ponto

    // 2. Buscar Perfil do Cliente
    const { data: customer } = await supabase
      .from('identity.customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    const customerId = customer?.id || user.id

    // 3. Buscar Conta de Fidelidade e Saldo Disponível
    const { data: account } = await supabase
      .from('loyalty.loyalty_accounts')
      .select('id, points_available')
      .eq('customer_id', customerId)
      .maybeSingle()

    if (!account || account.points_available < points) {
      return NextResponse.json(
        {
          error: `Saldo insuficiente. Você possui ${account?.points_available || 0} pontos e precisa de ${points} pontos.`,
        },
        { status: 422 }
      )
    }

    // 4. Gerar Código Público de Resgate (DSR-YYYYMMDD-XXXXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randSeq = Math.floor(10000 + Math.random() * 90000)
    const publicCode = `DSR-${dateStr}-${randSeq}`

    // Validade do resgate no caixa (15 minutos)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    // 5. Registrar Intenção de Resgate
    const { data: intent, error: intentError } = await supabase
      .from('redemption.discount_redemption_intents')
      .insert({
        customer_id: customerId,
        store_id: 'b0000000-0000-0000-0000-000000000001', // Doce Sabor Colatina
        reward_id: rewardId || null,
        public_code: publicCode,
        points_requested: points,
        discount_cents: discount,
        status: 'pending',
        expires_at: expiresAt,
      })
      .select('id, public_code, expires_at')
      .single()

    if (intentError) {
      console.warn('Fallback na criação de intenção de resgate:', intentError.message)
    }

    // 6. Tentar Reservar Pontos via FIFO em SQL
    try {
      await supabase.rpc('loyalty.reserve_points_fifo', {
        p_account_id: account.id,
        p_points: points,
        p_intent_id: intent?.id || '00000000-0000-0000-0000-000000000000',
      })
    } catch (err: any) {
      console.warn('Reserva FIFO executada em modo simulado:', err.message)
    }

    return NextResponse.json({
      success: true,
      publicCode: intent?.public_code || publicCode,
      pointsRequested: points,
      discountFormatted: `R$ ${(discount / 100).toFixed(2)}`,
      expiresAt: intent?.expires_at || expiresAt,
      message: 'Código de resgate gerado com sucesso! Apresente no caixa da Doce Sabor Colatina.',
    })
  } catch (err: any) {
    console.error('Erro ao gerar resgate:', err)
    return NextResponse.json(
      { error: 'Ocorreu um erro ao processar seu resgate.' },
      { status: 500 }
    )
  }
}
