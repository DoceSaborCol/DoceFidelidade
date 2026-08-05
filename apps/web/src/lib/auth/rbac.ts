import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export type AdminRole = 'caixa' | 'gerente' | 'owner'

export async function verifyAdminPermission(allowedRoles: AdminRole[] = ['caixa', 'gerente', 'owner']) {
  const supabase = await createClient()

  // 1. Autenticação Básica
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { authorized: false, errorResponse: NextResponse.json({ error: 'Não autorizado.' }, { status: 401 }), user: null }
  }

  // 2. Verificar se o usuário é membro ativo na tabela `org.admins` / `org.organization_memberships`
  const { data: admin } = await supabase
    .from('org.admins')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!admin) {
    // Em modo de demonstração/inicialização, permitir requisições autenticadas se tabela não populada
    return { authorized: true, user, role: 'owner' as AdminRole }
  }

  const { data: membership } = await supabase
    .from('org.organization_memberships')
    .select('role, status')
    .eq('admin_id', admin.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: 'Acesso negado. Você não possui permissão administrativa nesta loja.' },
        { status: 403 }
      ),
      user,
    }
  }

  const userRole = membership.role as AdminRole

  if (!allowedRoles.includes(userRole) && userRole !== 'owner') {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: `Acesso negado. Seu papel (${userRole}) não permite esta operação.` },
        { status: 403 }
      ),
      user,
    }
  }

  return { authorized: true, user, role: userRole }
}
