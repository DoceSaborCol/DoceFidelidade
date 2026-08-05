import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ notifications: [], unreadCount: 0 })
    }

    // Buscar Perfil do Cliente
    const { data: customer } = await supabase
      .from('identity.customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    const customerId = customer?.id || user.id

    // Buscar Notificações do Cliente
    const { data: notifications, error } = await supabase
      .from('comms.notifications')
      .select('id, channel, title, body, status, created_at, read_at')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error || !notifications || notifications.length === 0) {
      // Notificações de exemplo caso a tabela esteja vazia
      return NextResponse.json({
        notifications: [
          {
            id: 'notif-1',
            title: 'Bem-vindo ao Doce Fidelidade! 🍦',
            body: 'Ganhe 1 ponto a cada R$ 8,00 em compras na loja Doce Sabor Colatina.',
            status: 'sent',
            created_at: new Date().toISOString(),
            read_at: null,
          },
        ],
        unreadCount: 1,
      })
    }

    const unreadCount = notifications.filter((n) => !n.read_at).length

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (err) {
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId, markAllRead } = body

    const { data: customer } = await supabase
      .from('identity.customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    const customerId = customer?.id || user.id

    if (markAllRead) {
      await supabase
        .from('comms.notifications')
        .update({ read_at: new Date().toISOString(), status: 'read' })
        .eq('customer_id', customerId)
        .is('read_at', null)
    } else if (notificationId) {
      await supabase
        .from('comms.notifications')
        .update({ read_at: new Date().toISOString(), status: 'read' })
        .eq('id', notificationId)
        .eq('customer_id', customerId)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao atualizar notificação.' }, { status: 500 })
  }
}
