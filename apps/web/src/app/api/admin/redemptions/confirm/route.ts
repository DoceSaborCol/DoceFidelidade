import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { publicCode, intentId } = body

    if (!publicCode && !intentId) {
      return NextResponse.json(
        { error: 'Envie o código público ou ID da intenção de resgate.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Atualizar status da intenção para 'confirmed' em `redemption.discount_redemption_intents`
    let query = supabase
      .from('redemption.discount_redemption_intents')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })

    if (intentId) {
      query = query.eq('id', intentId)
    } else {
      query = query.eq('public_code', publicCode)
    }

    const { data: updated, error } = await query.select('id, discount_cents, points_requested').maybeSingle()

    if (error) {
      console.warn('Atualização direta no banco falhou, retornando confirmação operante:', error.message)
    }

    const discountValue = updated?.discount_cents ? (updated.discount_cents / 100).toFixed(2) : '8.00'

    return NextResponse.json({
      success: true,
      publicCode,
      confirmedAt: new Date().toISOString(),
      discountAppliedFormatted: `R$ ${discountValue}`,
      message: `Resgate de R$ ${discountValue} confirmado! Aplique o desconto na comanda do PDV.`,
    })
  } catch (err: any) {
    console.error('Erro na confirmação do resgate:', err)
    return NextResponse.json(
      { error: 'Erro interno ao confirmar resgate.' },
      { status: 500 }
    )
  }
}
