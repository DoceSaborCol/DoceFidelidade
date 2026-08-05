'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Search, Award, ShieldCheck, ArrowLeft, Filter, Plus, UserCheck, RefreshCw } from 'lucide-react'

export default function AdminClientesPage() {
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)

  const customers = [
    {
      id: 'cust-1',
      name: 'Maria Silva Santos',
      email: 'maria.silva@gmail.com',
      cpf: '***.458.912-**',
      phone: '(27) 99841-2233',
      points: 24,
      tier: 'Prata',
      createdAt: '2026-07-15',
    },
    {
      id: 'cust-2',
      name: 'João Pedro Oliveira',
      email: 'joao.pedro@hotmail.com',
      cpf: '***.123.789-**',
      phone: '(27) 99712-4455',
      points: 12,
      tier: 'Bronze',
      createdAt: '2026-07-20',
    },
    {
      id: 'cust-3',
      name: 'Ana Paula Costa',
      email: 'anapaula.colatina@gmail.com',
      cpf: '***.882.341-**',
      phone: '(27) 99901-8877',
      points: 48,
      tier: 'Ouro',
      createdAt: '2026-06-01',
    },
  ]

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
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
            <h1 className="text-xl font-black text-[var(--text-primary)]">Gestão de Clientes</h1>
            <p className="text-xs text-[var(--text-secondary)]">Consulta de base de clientes, saldos de pontos e histórico</p>
          </div>
        </div>

        <button className="px-4 py-2.5 rounded-2xl bg-[var(--brand-primary)] text-white text-xs font-bold shadow-md hover:bg-[var(--brand-primary-dark)] transition-colors flex items-center gap-1.5 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Cadastrar Cliente Manualmente</span>
        </button>
      </div>

      {/* Barra de Busca e Filtro */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente por nome, e-mail ou telefone..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[var(--border)] text-xs font-medium focus:outline-none focus:border-[var(--brand-primary)] bg-white shadow-xs"
          />
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-white rounded-3xl border border-[var(--border)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--brand-surface)] text-[var(--text-secondary)] uppercase font-bold border-b border-[var(--border)]">
              <tr>
                <th className="p-4">Cliente</th>
                <th className="p-4">WhatsApp / Telefone</th>
                <th className="p-4">Saldo de Pontos</th>
                <th className="p-4">Nível VIP</th>
                <th className="p-4">Data de Cadastro</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-[var(--text-primary)]">
                    <div>{client.name}</div>
                    <div className="text-[10px] text-[var(--text-secondary)] font-normal">{client.email}</div>
                  </td>
                  <td className="p-4 text-[var(--text-secondary)]">{client.phone}</td>
                  <td className="p-4">
                    <span className="font-black text-[var(--brand-primary)] text-sm">{client.points} pts</span>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                      {client.tier}
                    </span>
                  </td>
                  <td className="p-4 text-[var(--text-secondary)]">{client.createdAt}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedCustomer(client)}
                      className="px-3 py-1.5 rounded-xl border border-[var(--border)] text-[var(--brand-primary)] font-bold text-[11px] hover:bg-[var(--brand-surface)] transition-colors"
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
