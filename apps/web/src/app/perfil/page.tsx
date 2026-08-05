'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, Phone, ShieldCheck, Download, Trash2, LogOut, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'

export default function PerfilPage() {
  const router = useRouter()
  const [feedback, setFeedback] = useState<string | null>(null)

  function handleLogout() {
    router.push('/login')
  }

  function handleExportData() {
    setFeedback('Sua solicitação de exportação de dados (LGPD) foi registrada. Em breve enviaremos um e-mail com a cópia dos seus dados.')
  }

  function handleDeleteAccount() {
    setFeedback('Sua solicitação de exclusão de conta foi enviada ao encarregado de dados. Entraremos em contato para confirmação.')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="w-10 h-10 rounded-xl bg-white border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--brand-surface)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Seu Perfil</h1>
          <p className="text-xs text-[var(--text-secondary)]">Gerencie seus dados pessoais e preferências de privacidade</p>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Dados do Perfil */}
      <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-4 border-b border-[var(--border)] pb-6">
          <div className="w-16 h-16 rounded-2xl bg-[var(--brand-surface)] text-[var(--brand-primary)] flex items-center justify-center font-black text-xl">
            DS
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Cliente Doce Sabor</h2>
            <p className="text-xs text-[var(--text-secondary)]">Membro do Programa Fidelidade Colatina</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
            <span className="text-[var(--text-secondary)] font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-[var(--brand-primary)]" />
              E-mail registrado
            </span>
            <span className="font-bold text-[var(--text-primary)]">cliente@docesabor.com.br</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
            <span className="text-[var(--text-secondary)] font-medium flex items-center gap-2">
              <Phone className="w-4 h-4 text-[var(--brand-primary)]" />
              WhatsApp / Celular
            </span>
            <span className="font-bold text-[var(--text-primary)]">(27) 99999-9999</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-[var(--text-secondary)] font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Status LGPD
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
              Consentimento Ativo
            </span>
          </div>
        </div>
      </div>

      {/* Privacidade e Direitos LGPD (Seção 7.15) */}
      <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Direitos e Privacidade (LGPD)</h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Você tem total controle sobre os seus dados pessoais. Solicite uma cópia das suas informações ou a exclusão da sua conta a qualquer momento.
        </p>

        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleExportData}
            className="p-3.5 rounded-2xl border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs hover:bg-[var(--brand-surface)] transition-colors flex items-center gap-2 justify-center"
          >
            <Download className="w-4 h-4 text-[var(--brand-primary)]" />
            <span>Exportar Meus Dados (PDF)</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteAccount}
            className="p-3.5 rounded-2xl border border-red-200 text-red-600 font-bold text-xs hover:bg-red-50 transition-colors flex items-center gap-2 justify-center"
          >
            <Trash2 className="w-4 h-4" />
            <span>Solicitar Exclusão da Conta</span>
          </button>
        </div>
      </div>

      {/* Botão Sair */}
      <button
        onClick={handleLogout}
        className="w-full py-3.5 px-4 rounded-2xl bg-white border border-red-200 text-red-600 font-bold text-xs shadow-xs hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        <span>Sair da Conta</span>
      </button>
    </div>
  )
}
