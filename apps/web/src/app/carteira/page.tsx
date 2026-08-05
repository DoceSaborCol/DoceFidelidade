'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Wallet, QrCode, ArrowUpRight, ArrowDownLeft, Clock, Award, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react'

export default function CarteiraPage() {
  const [activeTab, setActiveTab] = useState<'extrato' | 'lotes'>('extrato')

  // Dados mockados/iniciais para apresentação (serão alimentados pelo Supabase)
  const walletData = {
    pointsAvailable: 0,
    pointsReserved: 0,
    pointsExpiringSoon: 0,
    nextExpiryDate: null,
    discountEquivalent: 0,
    vipLevel: 'Bronze',
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header da Carteira */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Sua Carteira</h1>
          <p className="text-xs text-[var(--text-secondary)]">Gerencie seu saldo, lotes e histórico de pontos</p>
        </div>
        <Link
          href="/escanear"
          className="px-4 py-2.5 rounded-2xl bg-[var(--brand-primary)] text-white text-xs font-bold shadow-md hover:bg-[var(--brand-primary-dark)] transition-colors flex items-center gap-1.5"
        >
          <QrCode className="w-4 h-4" />
          <span>Escanear Nota</span>
        </Link>
      </div>

      {/* Card Principal de Saldo */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[var(--border)] shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
          {/* Pontos Disponíveis */}
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold">
              Pontos Disponíveis
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-[var(--brand-primary)]">
                {walletData.pointsAvailable}
              </span>
              <span className="text-xs font-bold text-[var(--text-secondary)]">pts</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Vale <strong className="text-[var(--text-primary)]">R$ {walletData.discountEquivalent.toFixed(2)}</strong> em descontos
            </p>
          </div>

          {/* Pontos Reservados */}
          <div className="pt-4 sm:pt-0 sm:pl-6 space-y-1">
            <span className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold">
              Pontos Reservados
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-amber-600">
                {walletData.pointsReserved}
              </span>
              <span className="text-xs font-bold text-[var(--text-secondary)]">pts</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">Em resgates pendentes no caixa</p>
          </div>

          {/* Pontos a Expirar */}
          <div className="pt-4 sm:pt-0 sm:pl-6 space-y-1">
            <span className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold">
              Próxima Expiração
            </span>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] pt-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Nenhum ponto prestes a expirar</span>
            </div>
          </div>
        </div>

        {/* Status VIP */}
        <div className="p-4 rounded-2xl bg-[var(--brand-surface)] border border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--text-primary)] block">
                Nível VIP: {walletData.vipLevel}
              </span>
              <span className="text-[11px] text-[var(--text-secondary)] block">
                Ganhe 1 ponto a cada R$ 8,00 em compras
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-[var(--brand-primary)]">Progresso VIP</span>
        </div>
      </div>

      {/* Abas Extrato / Lotes */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
          <button
            onClick={() => setActiveTab('extrato')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'extrato'
                ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Histórico de Movimentações
          </button>
          <button
            onClick={() => setActiveTab('lotes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'lotes'
                ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Lotes de Pontos (FIFO)
          </button>
        </div>

        {activeTab === 'extrato' ? (
          <div className="bg-white rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden shadow-xs">
            <div className="p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[var(--brand-surface)] text-[var(--brand-primary)] flex items-center justify-center mx-auto">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Nenhuma movimentação registrada</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                Escaneie seu primeiro cupom fiscal NFC-e da Doce Sabor para acumular seus primeiros pontos!
              </p>
              <div className="pt-2">
                <Link
                  href="/escanear"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-xs font-bold hover:bg-[var(--brand-primary-dark)] transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Escanear Primeiro Cupom</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[var(--border)] p-6 text-center space-y-2">
            <h3 className="font-bold text-sm text-[var(--text-primary)]">Seus Lotes de Pontos</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
              Cada compra gera um lote de pontos com validade própria. O sistema consome automaticamente o lote com vencimento mais próximo (FIFO).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
