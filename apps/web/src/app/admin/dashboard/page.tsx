'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Users, Wallet, QrCode, Gift, BarChart3, Settings, ShieldCheck, 
  TrendingUp, FileSpreadsheet, FileText, Sparkles, Clock, AlertTriangle, ArrowUpRight 
} from 'lucide-react'

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState('7d')

  return (
    <div className="min-h-screen bg-[var(--brand-surface)] flex">
      {/* Sidebar Administrativa */}
      <aside className="w-64 bg-white border-r border-[var(--border)] hidden lg:flex flex-col justify-between p-4 sticky top-0 h-screen">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold">
              DS
            </div>
            <div>
              <span className="font-bold text-sm text-[var(--text-primary)] block">Doce Sabor Admin</span>
              <span className="text-[10px] text-[var(--brand-primary)] font-semibold block">Painel de Gestão</span>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold bg-[var(--brand-primary)] text-white shadow-xs"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--brand-surface)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Clientes</span>
            </Link>
            <Link
              href="/admin/validar-resgate"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--brand-surface)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Validar Resgates</span>
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--brand-surface)] hover:text-[var(--text-primary)] transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span>Cupons Fiscais</span>
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--brand-surface)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Gift className="w-4 h-4" />
              <span>Recompensas</span>
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--brand-surface)] hover:text-[var(--text-primary)] transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Importação Legada</span>
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--brand-surface)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
            </Link>
          </nav>
        </div>

        <div className="p-3 rounded-2xl bg-[var(--brand-surface)] border border-[var(--border)] text-xs space-y-1">
          <span className="font-bold text-[var(--text-primary)] block">Loja Colatina</span>
          <span className="text-[10px] text-[var(--text-secondary)] block">CNPJ: 02.982.922/0001-77</span>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-6xl">
        {/* Header Admin */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[var(--text-primary)]">Painel Executivo</h1>
            <p className="text-xs text-[var(--text-secondary)]">Métricas em tempo real da loja Doce Sabor Colatina</p>
          </div>

          <div className="flex items-center gap-2">
            {['hoje', '7d', '30d', 'mes'].map((item) => (
              <button
                key={item}
                onClick={() => setPeriod(item)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                  period === item
                    ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                    : 'bg-white border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[var(--border)] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-bold">
              <span>Total de Clientes</span>
              <Users className="w-4 h-4 text-[var(--brand-primary)]" />
            </div>
            <div className="text-3xl font-black text-[var(--text-primary)]">1,248</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12% neste mês</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[var(--border)] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-bold">
              <span>Pontos Emitidos</span>
              <Wallet className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-[var(--text-primary)]">4,890</div>
            <div className="text-[11px] text-[var(--text-secondary)]">R$ 39.120,00 em compras</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[var(--border)] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-bold">
              <span>NFC-e Validadas</span>
              <QrCode className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-[var(--text-primary)]">382</div>
            <div className="text-[11px] text-emerald-600 font-semibold">98.5% taxa de aprovação</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[var(--border)] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-bold">
              <span>Resgates Efetuados</span>
              <Gift className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-3xl font-black text-[var(--text-primary)]">94</div>
            <div className="text-[11px] text-[var(--text-secondary)]">R$ 752,00 em descontos</div>
          </div>
        </div>

        {/* Atalhos Operacionais Rápido */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] text-white shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Ações Rápidas do Gestor</h3>
              <p className="text-xs text-white/80">Operações frequentes de atendimento e revisão</p>
            </div>
            <Sparkles className="w-6 h-6 text-[var(--brand-accent)]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/admin/validar-resgate"
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md font-bold text-xs transition-colors flex items-center justify-between"
            >
              <span>Validar Código de Caixa</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              href="#"
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md font-bold text-xs transition-colors flex items-center justify-between"
            >
              <span>Revisar Notas Pendentes</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              href="#"
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md font-bold text-xs transition-colors flex items-center justify-between"
            >
              <span>Importar Dados Legados</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
