'use client'

import { useState } from 'react'
import { QrCode, Camera, Keyboard, AlertCircle, CheckCircle2, Loader2, Info, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EscanearPage() {
  const [accessKey, setAccessKey] = useState('')
  const [manualMode, setManualMode] = useState(false)
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{ points: number; value: number } | null>(null)

  // Validador simples de chave NFC-e (44 dígitos + modelo 65)
  function validateAccessKey(key: string): boolean {
    const cleaned = key.replace(/\D/g, '')
    if (cleaned.length !== 44) return false
    const model = cleaned.substring(20, 22)
    return model === '65' // Modelo 65 = NFC-e
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleanedKey = accessKey.replace(/\D/g, '')

    if (!cleanedKey) {
      setErrorMessage('Digite ou cole os 44 dígitos da chave de acesso.')
      return
    }

    if (cleanedKey.length !== 44) {
      setErrorMessage(`A chave deve conter exatamente 44 dígitos (você digitou ${cleanedKey.length}).`)
      return
    }

    if (!validateAccessKey(cleanedKey)) {
      setErrorMessage('Esta chave não pertence a uma NFC-e (Modelo 65). Verifique a chave digitada.')
      return
    }

    // Processar chave
    setStatus('processing')
    setErrorMessage(null)

    setTimeout(() => {
      // Simulação de validação fiscal bem sucedida (em produção chama Edge Function com CSC)
      setStatus('success')
      setSuccessData({
        points: 3,
        value: 24.90,
      })
    }, 1500)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="w-10 h-10 rounded-xl bg-white border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--brand-surface)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Escanear NFC-e</h1>
          <p className="text-xs text-[var(--text-secondary)]">Acumule pontos com seu cupom fiscal da Doce Sabor</p>
        </div>
      </div>

      {/* Orientações rápidas */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-bold">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Dica importante</span>
        </div>
        <p className="leading-relaxed text-amber-800">
          Solicite sempre o seu CPF no caixa na hora da compra para vincular a nota com total segurança.
        </p>
      </div>

      {/* Card do Scanner / Form */}
      <div className="bg-white rounded-3xl border border-[var(--border)] shadow-md overflow-hidden p-6 space-y-6">
        {status === 'success' && successData ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-emerald-700">+{successData.points} Pontos Creditados!</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Nota fiscal de R$ {successData.value.toFixed(2)} validada com sucesso.
              </p>
            </div>
            <div className="pt-4 flex flex-col gap-2">
              <Link
                href="/carteira"
                className="w-full py-3 px-4 rounded-2xl bg-[var(--brand-primary)] text-white font-bold text-sm text-center shadow-md hover:bg-[var(--brand-primary-dark)] transition-colors"
              >
                Ver na Carteira
              </Link>
              <button
                onClick={() => {
                  setStatus('idle')
                  setAccessKey('')
                  setSuccessData(null)
                }}
                className="w-full py-2.5 px-4 rounded-2xl border border-[var(--border)] text-[var(--text-primary)] font-semibold text-xs text-center hover:bg-[var(--brand-surface)] transition-colors"
              >
                Escanear Outro Cupom
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Alternar Scanner / Manual */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-[var(--brand-surface)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  !manualMode
                    ? 'bg-white text-[var(--brand-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Usar Câmera</span>
              </button>
              <button
                type="button"
                onClick={() => setManualMode(true)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  manualMode
                    ? 'bg-white text-[var(--brand-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Keyboard className="w-4 h-4" />
                <span>Digitar Chave</span>
              </button>
            </div>

            {!manualMode ? (
              /* Leitor de Câmera (Moldura UI) */
              <div className="space-y-4 text-center">
                <div className="relative aspect-square max-w-xs mx-auto rounded-3xl bg-slate-900 overflow-hidden flex flex-col items-center justify-center p-6 border-4 border-[var(--brand-primary)]/30 shadow-inner">
                  <div className="absolute inset-4 border-2 border-dashed border-white/60 rounded-2xl pointer-events-none animate-pulse" />
                  <QrCode className="w-16 h-16 text-white/40 mb-3" />
                  <p className="text-xs text-white/80 font-medium z-10 px-4">
                    Posicione o QR Code da sua NFC-e dentro do enquadramento
                  </p>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Ou alterne para a aba <strong className="text-[var(--text-primary)]">"Digitar Chave"</strong> para colar o código de 44 dígitos.
                </p>
              </div>
            ) : (
              /* Formulário Manual de 44 dígitos */
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                    Chave de Acesso NFC-e (44 Dígitos)
                  </label>
                  <textarea
                    rows={3}
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    placeholder="Cole ou digite aqui a chave de acesso impressa no seu cupom fiscal (ex: 32260802982922000177650010000184211000041300)"
                    className="w-full p-3.5 rounded-2xl border border-[var(--border)] text-xs font-mono focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all resize-none"
                  />
                  <span className="text-[10px] text-[var(--text-secondary)] mt-1 block">
                    {accessKey.replace(/\D/g, '').length} / 44 dígitos
                  </span>
                </div>

                {errorMessage && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'processing'}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {status === 'processing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validando Nota Fiscal...</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      <span>Validar e Creditar Pontos</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
