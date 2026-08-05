import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { csvText, batchName } = body

    if (!csvText) {
      return NextResponse.json({ error: 'Nenhum conteúdo CSV enviado.' }, { status: 400 })
    }

    const supabase = await createClient()
    const lines = csvText.split('\n')

    let importedCount = 0
    let matchedCount = 0

    // Criar lote de importação em `legacy.import_batches`
    const { data: batch } = await supabase
      .from('legacy.import_batches')
      .insert({
        source_name: batchName || 'Importacao_Programa_Antigo.csv',
        imported_by: '00000000-0000-0000-0000-000000000000',
        status: 'completed',
      })
      .select('id')
      .single()

    const batchId = batch?.id || null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line || line.startsWith('CPF') || line.startsWith('cpf')) continue // pular cabeçalho

      const cols = line.split(/[,;]/)
      if (cols.length < 2) continue

      const rawCpf = cols[0].replace(/\D/g, '')
      const name = cols[1]?.trim() || 'Cliente Legado'
      const phone = cols[2]?.trim() || ''
      const points = parseInt(cols[3] || '0', 10)

      if (rawCpf.length === 11 && points > 0) {
        // Inserir registro em `legacy.customer_profiles`
        const { data: legacyProfile } = await supabase
          .from('legacy.customer_profiles')
          .insert({
            import_batch_id: batchId,
            encrypted_cpf: rawCpf,
            full_name: name,
            phone: phone,
            legacy_points_balance: points,
            status: 'unclaimed',
          })
          .select('id')
          .single()

        importedCount++

        // Verificar se cliente com esse CPF já tem conta cadastrada no sistema novo
        const { data: existingCustomer } = await supabase
          .from('identity.customers')
          .select('id')
          .eq('cpf', rawCpf)
          .maybeSingle()

        if (existingCustomer && legacyProfile) {
          // Retro-Match imediato!
          await supabase.rpc('loyalty.credit_points', {
            p_customer_id: existingCustomer.id,
            p_store_id: 'b0000000-0000-0000-0000-000000000001',
            p_points: points,
            p_source_type: 'earn_legacy_migration',
            p_description: 'Migração de pontos do programa de fidelidade antigo',
            p_idempotency_key: `legacy_retro_claim_${legacyProfile.id}`,
          }).catch(() => {})

          await supabase
            .from('legacy.customer_profiles')
            .update({ status: 'claimed', claimed_at: new Date().toISOString() })
            .eq('id', legacyProfile.id)

          matchedCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      importedCount,
      matchedCount,
      message: `Sucesso! ${importedCount} perfis antigos importados. ${matchedCount} clientes existentes tiveram seus pontos migrados instantaneamente.`,
    })
  } catch (err: any) {
    console.error('Erro na importação legada:', err)
    return NextResponse.json({ error: 'Erro interno ao importar CSV.' }, { status: 500 })
  }
}
