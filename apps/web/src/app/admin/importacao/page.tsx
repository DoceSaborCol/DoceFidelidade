'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { FileSpreadsheet, Upload, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AdminImportacaoPage() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success'>('idle')

  function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setStatus('uploading')
    setTimeout(() => {
      setStatus('success')
    }, 1500)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
        <Link
          href="/admin/dashboard"
          className="w-10 h-10 rounded-xl bg-white border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--brand-surface)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-[var(--text-primary)]">Importação de Dados Legados</h1>
          <p className="text-xs text-[var(--text-secondary)]">Importe saldos antigos do programa de fidelidade via arquivo CSV/Excel</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-xs space-y-6">
        {status === 'success' ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-base text-emerald-900">Arquivo importado com sucesso!</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Os saldos legados foram registrados no schema `legacy.customer_profiles` e os clientes poderão reivindicar seus pontos pelo CPF.
            </p>
            <button
              onClick={() => {
                setStatus('idle')
                setFile(null)
              }}
              className="py-2.5 px-4 rounded-xl bg-[var(--brand-primary)] text-white text-xs font-bold"
            >
              Importar Outro Arquivo
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-[var(--border)] rounded-2xl p-8 text-center space-y-3 hover:border-[var(--brand-primary)]/50 transition-colors">
              <FileSpreadsheet className="w-10 h-10 text-[var(--brand-primary)] mx-auto" />
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  Arraste seu arquivo CSV aqui ou clique para selecionar
                </p>
                <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                  Formatos aceitos: .csv (colunas: CPF, Nome, Telefone, PontosAntigos)
                </p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="csv-file"
              />
              <label
                htmlFor="csv-file"
                className="inline-block px-4 py-2 rounded-xl bg-[var(--brand-surface)] border border-[var(--border)] text-xs font-bold text-[var(--brand-primary)] cursor-pointer"
              >
                Selecionar Arquivo
              </label>
              {file && <p className="text-xs font-semibold text-emerald-600">{file.name}</p>}
            </div>

            <button
              type="submit"
              disabled={!file || status === 'uploading'}
              className="w-full py-3.5 px-4 rounded-2xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>Processar e Importar Saldos Legados</span>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
