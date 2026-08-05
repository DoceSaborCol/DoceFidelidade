'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCPF, validateCPF } from '@/lib/utils/cpf'
import { IceCream, User, Mail, Lock, ArrowRight, AlertCircle, Loader2, Phone, CreditCard, Sparkles } from 'lucide-react'

export default function CadastroPage() {
  const [fullName, setFullName] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCpf(formatCPF(e.target.value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const rawCpf = cpf.replace(/\D/g, '')

    if (!validateCPF(rawCpf)) {
      setError('CPF inválido. Verifique os dígitos digitados.')
      return
    }

    if (!termsAccepted) {
      setError('Você precisa aceitar os Termos e a Política de Privacidade para se cadastrar.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            cpf: rawCpf,
            phone,
          },
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (authData.user) {
        // 2. Chamar a API de cadastro para registrar perfil no banco e buscar pontos legados automaticamente
        await fetch('/api/auth/register-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: authData.user.id,
            fullName,
            cpf: rawCpf,
            email,
            phone,
          }),
        })

        router.push('/carteira')
        router.refresh()
      }
    } catch (err: any) {
      setError('Ocorreu um erro no cadastro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--brand-surface)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--brand-primary)] text-white flex items-center justify-center shadow-lg">
            <IceCream className="w-7 h-7" />
          </div>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Criar sua conta no Doce Fidelidade
        </h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Informe seu CPF para vincular suas NFC-e e resgatar pontos antigos automaticamente
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-[var(--border)] sm:px-10 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                Nome Completo
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                CPF (Obrigatório para NFC-e e Pontos)
              </label>
              <div className="relative">
                <CreditCard className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  required
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[var(--border)] text-sm font-mono focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                />
              </div>
              <span className="text-[10px] text-[var(--text-secondary)] mt-1 block">
                O CPF é essencial para validação das notas fiscais e migração do programa antigo.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                WhatsApp / Telefone
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(27) 99999-9999"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                />
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[var(--brand-primary)] rounded border-[var(--border)] focus:ring-[var(--brand-primary)]"
              />
              <label htmlFor="terms" className="text-xs text-[var(--text-secondary)] leading-tight">
                Li e aceito os{' '}
                <Link href="#" className="font-semibold text-[var(--brand-primary)] hover:underline">
                  Termos do Programa
                </Link>{' '}
                e o{' '}
                <Link href="#" className="font-semibold text-[var(--brand-primary)] hover:underline">
                  Aviso de Privacidade LGPD
                </Link>
                .
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Criando Conta e Verificando Pontos...</span>
                </>
              ) : (
                <>
                  <span>Concluir Cadastro</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-[var(--border)] text-center text-xs text-[var(--text-secondary)]">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-bold text-[var(--brand-primary)] hover:underline">
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
