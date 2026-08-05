'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { QrCode, Plus, ArrowLeft, CheckCircle2, Ticket } from 'lucide-react'

export default function AdminCuponsPage() {
  const coupons = [
    {
      id: 'c1',
      code: 'BEMVINDOCOLATINA',
      description: 'Cupom de boas-vindas: 5 pontos bônus no primeiro cadastro',
      bonusPoints: 5,
      usageLimit: 500,
      usedCount: 142,
      status: 'ativo',
    },
    {
      id: 'c2',
      code: 'VERAO2026',
      description: 'Campanha de Verão: Dobro de pontos em milk-shakes',
      bonusPoints: 10,
      usageLimit: 200,
      usedCount: 88,
      status: 'ativo',
    },
  ]

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
            <h1 className="text-xl font-black text-[var(--text-primary)]">Gestão de Promoções e Cupons</h1>
            <p className="text-xs text-[var(--text-secondary)]">Crie cupons promocionais de bônus e acompanhe o uso</p>
          </div>
        </div>

        <button className="px-4 py-2.5 rounded-2xl bg-[var(--brand-primary)] text-white text-xs font-bold shadow-md hover:bg-[var(--brand-primary-dark)] transition-colors flex items-center gap-1.5 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Criar Novo Cupom</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="p-5 rounded-3xl bg-white border border-[var(--border)] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[var(--brand-primary)]" />
                <span className="font-mono font-black text-sm text-[var(--brand-primary)]">{coupon.code}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                {coupon.status}
              </span>
            </div>

            <p className="text-xs text-[var(--text-primary)] leading-relaxed">{coupon.description}</p>

            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Uso: <strong>{coupon.usedCount}</strong> / {coupon.usageLimit}</span>
              <span className="font-bold text-amber-600">+{coupon.bonusPoints} pts bônus</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
