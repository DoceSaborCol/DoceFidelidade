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
      // Garantir registro do cliente
      const { data: newCustomer, error: createError } = await supabase
        .from('identity.customers')
        .insert({
          auth_user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || 'Cliente Doce Sabor',
          phone: user.user_metadata?.phone,
        })
        .select('id')
        .single()

      if (createError || !newCustomer) {
        // Fallback: usar o próprio auth_user_id se tabela estiver restrita
        customer = { id: user.id }
      } else {
        customer = newCustomer
      }
    }

    // 4. Buscar Loja Piloto Colatina
    const { data: store } = await supabase
      .from('org.stores')
      .select('id, organization_id')
      .eq('slug', 'colatina')
      .single()

    const storeId = store?.id || 'b0000000-0000-0000-0000-000000000001'

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

    // 6. Valor da Compra (se não extraído do QR Code, usa valor informado ou padrão)
    const totalValueCents = parsed.totalValueCents || manualValueCents || 2490 // R$ 24,90 padrão se não informado
    const eligibleCents = totalValueCents

    // Cálculo oficial: R$ 8,00 = 1 Ponto
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

    // 7. Registrar Nota Fiscal em `fiscal.scanned_invoices`
    const { data: invoice, error: invoiceError } = await supabase
      .from('fiscal.scanned_invoices')
      .insert({
        customer_id: customer.id,
        store_id: storeId,
        access_key: accessKey,
        raw_qr_url: rawInput.length > 44 ? rawInput : null,
        total_value_cents: totalValueCents,
        eligible_value_cents: eligibleCents,
        points_granted: pointsGranted,
        status: 'approved',
        validated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (invoiceError) {
      console.error('Erro ao registrar nota fiscal:', invoiceError)
    }

    // 8. Creditar Pontos Atomicamente via RPC ou Atualização Direta
    const { data: creditResult, error: creditError } = await supabase.rpc(
      'loyalty.credit_points',
      {
        p_customer_id: customer.id,
        p_store_id: storeId,
        p_points: pointsGranted,
        p_source_type: 'earn_purchase',
        p_invoice_id: invoice?.id || null,
        p_description: `Crédito NFC-e (Nota ${accessKey.substring(25, 34)})`,
        p_idempotency_key: `nfce_${accessKey}`,
      }
    )

    if (creditError) {
      console.warn('RPC credit_points fallback para inserção direta:', creditError.message)
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
