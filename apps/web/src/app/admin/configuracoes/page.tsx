'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { Settings, ShieldCheck, Users, Save, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function AdminConfiguracoesPage() {
  const [centsPerPoint, setCentsPerPoint] = useState(800)
  const [pointValueCents, setPointValueCents] = useState(100)
  const [saved, setSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
        <Link
          href="/admin/dashboard"
          className="w-10 h-10 rounded-xl bg-white border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--brand-surface)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-[var(--text-primary)]">Configurações da Loja</h1>
          <p className="text-xs text-[var(--text-secondary)]">Gerencie as regras de pontuação, dados da loja e permissões da equipe (RBAC)</p>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Configurações salvas com sucesso!</span>
        </div>
      )}

      {/* Regra de Pontuação Oficial */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-xs space-y-6">
        <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-3">
          Regra de Pontuação Oficial
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
              Valor em Compras por Ponto (R$)
            </label>
            <input
              type="number"
              value={centsPerPoint / 100}
              onChange={(e) => setCentsPerPoint(Number(e.target.value) * 100)}
              className="w-full p-3 rounded-2xl border border-[var(--border)] text-sm font-bold"
            />
            <span className="text-[10px] text-[var(--text-secondary)] mt-1 block">
              Padrão oficial: R$ 8,00 por cada 1 ponto acumulado.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
              Valor do Ponto em Desconto (R$)
            </label>
            <input
              type="number"
              value={pointValueCents / 100}
              onChange={(e) => setPointValueCents(Number(e.target.value) * 100)}
              className="w-full p-3 rounded-2xl border border-[var(--border)] text-sm font-bold"
            />
            <span className="text-[10px] text-[var(--text-secondary)] mt-1 block">
              Padrão oficial: 1 Ponto = R$ 1,00 de desconto no caixa.
            </span>
          </div>
        </div>

        {/* Gestão de Papéis e Permissões RBAC (Contexto Mestre Seção 6.2) */}
        <div className="pt-4 border-t border-[var(--border)] space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Equipe & Controle de Acesso (RBAC)</h3>

          <div className="space-y-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-[var(--brand-surface)] border border-[var(--border)] flex items-center justify-between">
              <div>
                <span className="font-bold text-[var(--text-primary)] block">Operador de Caixa</span>
                <span className="text-[10px] text-[var(--text-secondary)]">
                  Permissão restrita para consultar e confirmar códigos de resgate no PDV.
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                Papel: Caixa
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--brand-surface)] border border-[var(--border)] flex items-center justify-between">
              <div>
                <span className="font-bold text-[var(--text-primary)] block">Gerente da Loja</span>
                <span className="text-[10px] text-[var(--text-secondary)]">
                  Acesso a relatórios, catálogo de recompensas, promoções e aprovação manual de notas.
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                Papel: Gerente
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--brand-surface)] border border-[var(--border)] flex items-center justify-between">
              <div>
                <span className="font-bold text-[var(--text-primary)] block">Owner / Proprietário</span>
                <span className="text-[10px] text-[var(--text-secondary)]">
                  Acesso irrestrito a configurações globais, exclusão, auditoria e equipe.
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Papel: Owner
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 px-4 rounded-2xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Alterações de Configuração</span>
        </button>
      </form>
    </div>
  )
}
