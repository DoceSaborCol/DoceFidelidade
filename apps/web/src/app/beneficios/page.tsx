'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Gift, Sparkles, QrCode, Clock, CheckCircle2, AlertCircle, Loader2, ArrowLeft, IceCream } from 'lucide-react'

export default function BeneficiosPage() {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [activeCode, setActiveCode] = useState<{
    publicCode: string
    discountFormatted: string
    expiresAt: string
    rewardName: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rewards = [
    {
      id: 'reward-1',
      name: 'Desconto no Casquinha ou Cascão',
      description: 'Ganhe R$ 8,00 de desconto no seu sorvete soft favorito',
      pointsCost: 8,
      discountCents: 800,
      gradient: 'from-amber-100 to-amber-50 text-amber-700',
      badge: 'R$ 8,00 OFF',
    },
    {
      id: 'reward-2',
      name: 'Desconto no Milk-shake 500ml',
      description: 'Ganhe R$ 15,00 de desconto em qualquer sabor de milk-shake',
      pointsCost: 15,
      discountCents: 1500,
      gradient: 'from-orange-100 to-orange-50 text-[var(--brand-primary)]',
      badge: 'R$ 15,00 OFF',
    },
    {
      id: 'reward-3',
      name: 'Desconto no Açaí Especial',
      description: 'Ganhe R$ 20,00 de desconto na sua tigela de açaí especial',
      pointsCost: 20,
      discountCents: 2000,
      gradient: 'from-purple-100 to-purple-50 text-purple-700',
      badge: 'R$ 20,00 OFF',
    },
  ]

  async function handleRedeem(reward: (typeof rewards)[0]) {
    setLoadingId(reward.id)
    setError(null)

    try {
      const res = await fetch('/api/redemptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId: reward.id,
          pointsRequested: reward.pointsCost,
          discountCents: reward.discountCents,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Não foi possível gerar o resgate.')
        return
      }

      setActiveCode({
        publicCode: data.publicCode,
        discountFormatted: data.discountFormatted,
        expiresAt: data.expiresAt,
        rewardName: reward.name,
      })
    } catch (err) {
      setError('Erro de conexão ao solicitar resgate.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="w-10 h-10 rounded-xl bg-white border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--brand-surface)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Recompensas e Benefícios</h1>
          <p className="text-xs text-[var(--text-secondary)]">Troque seus pontos por descontos na Doce Sabor Colatina</p>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Código Ativo de Resgate (Modal / Highlight) */}
      {activeCode && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-dark)] text-white shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/20 pb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
              <span>Código Gerado com Sucesso</span>
            </div>
            <button
              onClick={() => setActiveCode(null)}
              className="text-xs text-white/80 hover:text-white underline font-semibold"
            >
              Fechar
            </button>
          </div>

          <div className="text-center space-y-3">
            <span className="text-xs uppercase tracking-wider text-white/80 font-bold block">
              {activeCode.rewardName}
            </span>
            <div className="py-4 px-6 rounded-2xl bg-white text-[var(--text-primary)] font-mono font-black text-2xl sm:text-3xl tracking-wider shadow-inner inline-block">
              {activeCode.publicCode}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-200 font-semibold pt-1">
              <Clock className="w-4 h-4" />
              <span>Válido por 15 minutos. Apresente este código no caixa!</span>
            </div>
          </div>
        </div>
      )}

      {/* Catálogo de Recompensas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {rewards.map((reward) => (
          <div
            key={reward.id}
            className="p-5 rounded-3xl bg-white border border-[var(--border)] shadow-xs space-y-4 hover:border-[var(--brand-primary)]/40 transition-colors flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className={`h-28 rounded-2xl bg-gradient-to-tr ${reward.gradient} flex items-center justify-center font-black text-2xl shadow-inner`}>
                {reward.badge}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                  Recompensa
                </span>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">{reward.name}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{reward.description}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[var(--text-secondary)]">Custo em pontos:</span>
                <span className="text-[var(--brand-primary)] font-black text-sm">{reward.pointsCost} pts</span>
              </div>

              <button
                type="button"
                disabled={loadingId === reward.id}
                onClick={() => handleRedeem(reward)}
                className="w-full py-3 px-4 rounded-2xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingId === reward.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gerando...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4" />
                    <span>Resgatar Recompensa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
