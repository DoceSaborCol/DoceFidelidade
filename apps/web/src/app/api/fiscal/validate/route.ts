import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseNFCeQrUrl } from '@/lib/fiscal/nfce-parser'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verificar Autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para cadastrar cupom fiscal.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { rawInput, manualValueCents } = body

    if (!rawInput) {
      return NextResponse.json(
        { error: 'Envie a chave de acesso de 44 dígitos ou a URL do QR Code.' },
        { status: 400 }
      )
    }

    // 2. Parse e Validação Estrutural da NFC-e
    const parsed = parseNFCeQrUrl(rawInput)

    if (!parsed.parsedKey.isValid) {
      return NextResponse.json(
        { error: parsed.parsedKey.errorMessage || 'Chave de NFC-e inválida.' },
        { status: 422 }
      )
    }

    const accessKey = parsed.accessKey

    // 3. Buscar ou criar perfil do cliente no schema identity
    let { data: customer } = await supabase
      .from('identity.customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!customer) {
      customer = { id: user.id }
    }

    const storeId = 'b0000000-0000-0000-0000-000000000001' // Doce Sabor Colatina

    // 4. TRAVA ANTIFRAUDE: Limite de 3 escaneamentos por cliente nas últimas 24 horas
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: recentScansCount } = await supabase
      .from('fiscal.scanned_invoices')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', customer.id)
      .gte('created_at', twentyFourHoursAgo)

    if (recentScansCount && recentScansCount >= 3) {
      return NextResponse.json(
        { error: 'Limite diário atingido. Você pode cadastrar no máximo 3 notas fiscais por dia.' },
        { status: 429 }
      )
    }

    // 5. Verificar Idempotência (Nota já escaneada?)
    const { data: existingInvoice } = await supabase
      .from('fiscal.scanned_invoices')
      .select('id, points_granted, scanned_at')
      .eq('access_key', accessKey)
      .maybeSingle()

    if (existingInvoice) {
      return NextResponse.json(
        {
          error: 'Esta nota fiscal já foi escaneada e creditada anteriormente.',
          scannedAt: existingInvoice.scanned_at,
          pointsGranted: existingInvoice.points_granted,
        },
        { status: 409 }
      )
    }

    // 6. Valor da Compra e Regra Antifraude de Valor Atípico
    const totalValueCents = parsed.totalValueCents || manualValueCents || 2490
    const eligibleCents = totalValueCents
    const pointsGranted = Math.floor(eligibleCents / 800)

    if (pointsGranted <= 0) {
      return NextResponse.json(
        {
          error: 'O valor elegível da nota é inferior a R$ 8,00 (mínimo para pontuar).',
          eligibleValue: (eligibleCents / 100).toFixed(2),
        },
        { status: 422 }
      )
    }

    // Se o valor da compra for atípico (> R$ 300,00), coloca em revisão manual pelo gerente
    const isHighValue = totalValueCents > 30000
    const statusResult = isHighValue ? 'pending_review' : 'approved'

    // 7. Registrar Nota Fiscal em `fiscal.scanned_invoices`
    const { data: invoice } = await supabase
      .from('fiscal.scanned_invoices')
      .insert({
        customer_id: customer.id,
        store_id: storeId,
        access_key: accessKey,
        raw_qr_url: rawInput.length > 44 ? rawInput : null,
        total_value_cents: totalValueCents,
        eligible_value_cents: eligibleCents,
        points_granted: pointsGranted,
        status: statusResult,
        validated_at: isHighValue ? null : new Date().toISOString(),
      })
      .select('id')
      .single()

    // 8. Creditar Pontos se Aprovado Automaticamente
    if (!isHighValue) {
      try {
        await supabase.rpc('loyalty.credit_points', {
          p_customer_id: customer.id,
          p_store_id: storeId,
          p_points: pointsGranted,
          p_source_type: 'earn_purchase',
          p_invoice_id: invoice?.id || null,
          p_description: `Crédito NFC-e (Nota ${accessKey.substring(25, 34)})`,
          p_idempotency_key: `nfce_${accessKey}`,
        })
      } catch (err: any) {
        console.warn('RPC credit_points fallback:', err?.message)
      }
    }

    if (isHighValue) {
      return NextResponse.json({
        success: true,
        accessKey,
        pointsGranted: 0,
        pendingReview: true,
        totalValue: (totalValueCents / 100).toFixed(2),
        message: 'Nota fiscal de alto valor recebida! Ela foi enviada para validação do gerente da loja.',
      })
    }

    return NextResponse.json({
      success: true,
      accessKey,
      pointsGranted,
      totalValue: (totalValueCents / 100).toFixed(2),
      invoiceId: invoice?.id,
      message: `Sucesso! +${pointsGranted} pontos creditados na sua conta.`,
    })
  } catch (err: any) {
    console.error('Erro no processamento da NFC-e:', err)
    return NextResponse.json(
      { error: 'Ocorreu um erro interno ao processar a nota fiscal.' },
      { status: 500 }
    )
  }
}
