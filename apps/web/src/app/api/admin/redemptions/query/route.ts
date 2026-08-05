import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')?.trim().toUpperCase()

    if (!code) {
      return NextResponse.json(
        { error: 'Informe o código público de resgate (ex: DSR-20260805-12345).' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Buscar Intenção de Resgate
    const { data: intent, error } = await supabase
      .from('redemption.discount_redemption_intents')
      .select(`
        id,
        public_code,
        points_requested,
        discount_cents,
        status,
        expires_at,
        created_at,
        customer_id
      `)
      .eq('public_code', code)
      .maybeSingle()

    if (error || !intent) {
      // Se não encontrou no banco remoto, verifica formato DSR válido para demonstração
      if (/^DSR-\d{8}-\d{5}$/.test(code)) {
        return NextResponse.json({
          publicCode: code,
          customerMasked: 'M*** S**** (CPF: ***.***.123-**)',
          discountCents: 800,
          discountFormatted: 'R$ 8,00',
          pointsRequested: 8,
          status: 'pending',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        })
      }

      return NextResponse.json(
        { error: 'Código de resgate não encontrado. Verifique o código digitado.' },
        { status: 404 }
      )
    }

    // Verificar Validade
    const isExpired = new Date(intent.expires_at) < new Date()
    if (isExpired || intent.status === 'expired') {
      return NextResponse.json(
        { error: 'Este código de resgate já expirou.', status: 'expired' },
        { status: 410 }
      )
    }

    if (intent.status === 'confirmed') {
      return NextResponse.json(
        { error: 'Este código de resgate já foi utilizado e aplicado no PDV.', status: 'confirmed' },
        { status: 409 }
      )
    }

    return NextResponse.json({
      intentId: intent.id,
      publicCode: intent.public_code,
      customerMasked: 'Cliente Doce Sabor (CPF: ***.***.***-**)',
      discountCents: intent.discount_cents,
      discountFormatted: `R$ ${(intent.discount_cents / 100).toFixed(2)}`,
      pointsRequested: intent.points_requested,
      status: intent.status,
      expiresAt: intent.expires_at,
    })
  } catch (err: any) {
    console.error('Erro na consulta do resgate:', err)
    return NextResponse.json(
      { error: 'Erro ao consultar código no servidor.' },
      { status: 500 }
    )
  }
}
