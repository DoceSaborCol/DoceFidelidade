'use client'

import { useState } from 'react'
import { ShieldCheck, Search, CheckCircle2, AlertCircle, Clock, IceCream, Loader2, ArrowRight } from 'lucide-react'

export default function ValidarResgatePage() {
  const [publicCode, setPublicCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'querying' | 'queried' | 'confirming' | 'confirmed' | 'error'>('idle')
  const [tokenData, setTokenData] = useState<{
    code: string
    customerMasked: string
    discountCents: number
    pointsRequested: number
    status: 'pending' | 'confirmed' | 'released' | 'expired'
  } | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function handleQuery(e: React.FormEvent) {
    e.preventDefault()
    if (!publicCode.trim()) return

    setStatus('querying')
    setMessage(null)

    // Consulta sem consumir (Contexto Mestre 8.3)
    setTimeout(() => {
      if (publicCode.toUpperCase().includes('EXPIRED')) {
        setStatus('error')
        setMessage('Este código de resgate já expirou ou foi cancelado.')
        return
      }

      setStatus('queried')
      setTokenData({
        code: publicCode.toUpperCase(),
        customerMasked: 'M*** S**** (CPF: ***.***.123-**)',
        discountCents: 800, // R$ 8,00
        pointsRequested: 8,
        status: 'pending',
      })
    }, 800)
  }

  function handleConfirm() {
    if (!tokenData) return

    setStatus('confirming')

    // Confirmação explícita atômica
    setTimeout(() => {
      setStatus('confirmed')
      setMessage('Resgate de R$ 8,00 confirmado com sucesso! Aplicar desconto no PDV.')
    }, 1000)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Operação Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[var(--text-primary)]">Validação de Resgate</h1>
            <p className="text-xs text-[var(--text-secondary)]">Caixa • Loja Colatina</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
          Caixa Operacional
        </span>
      </div>

      {/* Form de Consulta de Código */}
      <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-md space-y-6">
        <form onSubmit={handleQuery} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">
              Código de Resgate do Cliente (DSR-...)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={publicCode}
                onChange={(e) => setPublicCode(e.target.value)}
                placeholder="Ex: DSR-20260805-00413"
                className="flex-1 px-4 py-3.5 rounded-2xl border border-[var(--border)] text-sm font-mono font-bold focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 uppercase"
              />
              <button
                type="submit"
                disabled={status === 'querying'}
                className="px-6 py-3.5 rounded-2xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {status === 'querying' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Consultar</span>
                  </>
                )}
              </button>
            </div>
            <span className="text-[11px] text-[var(--text-secondary)] mt-1.5 block">
              A consulta exibe os detalhes do desconto <strong>sem consumir os pontos</strong>.
            </span>
          </div>
        </form>

        {/* Mensagem de Erro */}
        {status === 'error' && message && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Resultado da Consulta (Status Queried) */}
        {status === 'queried' && tokenData && (
          <div className="p-6 rounded-2xl bg-[var(--brand-surface)] border-2 border-[var(--brand-primary)] space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                  Cliente Identificado (Mascarado)
                </span>
                <h3 className="font-bold text-base text-[var(--text-primary)]">{tokenData.customerMasked}</h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                Pendente de Aplicação
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 rounded-xl bg-white border border-[var(--border)]">
                <span className="text-xs text-[var(--text-secondary)] block">Desconto a aplicar</span>
                <span className="text-2xl font-black text-emerald-600">
                  R$ {(tokenData.discountCents / 100).toFixed(2)}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[var(--border)]">
                <span className="text-xs text-[var(--text-secondary)] block">Pontos a consumir</span>
                <span className="text-2xl font-black text-[var(--brand-primary)]">
                  {tokenData.pointsRequested} pts
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={status === 'confirming'}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {status === 'confirming' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Confirmando no PDV...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>CONFIRMAR E APLICAR DESCONTO NO PDV</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Resgate Confirmado com Sucesso */}
        {status === 'confirmed' && (
          <div className="p-8 text-center space-y-4 bg-emerald-50 rounded-2xl border border-emerald-200">
            <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-emerald-900">Desconto Confirmado!</h2>
              <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                {message}
              </p>
            </div>
            <button
              onClick={() => {
                setStatus('idle')
                setPublicCode('')
                setTokenData(null)
              }}
              className="py-3 px-6 rounded-2xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition-colors shadow-sm"
            >
              Validar Próximo Resgate
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
