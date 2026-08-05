'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { Gift, Plus, ArrowLeft, CheckCircle2, Trash2, Edit3 } from 'lucide-react'

export default function AdminRecompensasPage() {
  const [rewards, setRewards] = useState([
    {
      id: '1',
      name: 'Desconto no Casquinha ou Cascão',
      pointsCost: 8,
      discountCents: 800,
      status: 'active',
    },
    {
      id: '2',
      name: 'Desconto no Milk-shake 500ml',
      pointsCost: 15,
      discountCents: 1500,
      status: 'active',
    },
    {
      id: '3',
      name: 'Desconto no Açaí Especial',
      pointsCost: 20,
      discountCents: 2000,
      status: 'active',
    },
  ])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="w-10 h-10 rounded-xl bg-white border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--brand-surface)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-[var(--text-primary)]">Gestão de Recompensas</h1>
            <p className="text-xs text-[var(--text-secondary)]">Cadastre e edite as opções de sobremesas e descontos em pontos</p>
          </div>
        </div>

        <button className="px-4 py-2.5 rounded-2xl bg-[var(--brand-primary)] text-white text-xs font-bold shadow-md hover:bg-[var(--brand-primary-dark)] transition-colors flex items-center gap-1.5 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Nova Recompensa</span>
        </button>
      </div>

      {/* Grid de Recompensas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {rewards.map((reward) => (
          <div key={reward.id} className="p-5 rounded-3xl bg-white border border-[var(--border)] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                Catálogo Ativo
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                {reward.status}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">{reward.name}</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Desconto de <strong>R$ {(reward.discountCents / 100).toFixed(2)}</strong>
              </p>
            </div>

            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-sm font-black text-[var(--brand-primary)]">{reward.pointsCost} pontos</span>
              <div className="flex gap-2">
                <button className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
