'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { QrCode, Camera, Keyboard, AlertCircle, CheckCircle2, Loader2, Info, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function EscanearPage() {
  const [accessKey, setAccessKey] = useState('')
  const [manualMode, setManualMode] = useState(false)
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{ points: number; value: string; key: string } | null>(null)

  const html5QrCodeRef = useRef<any>(null)
  const scannerContainerId = 'qr-reader'

  // Inicializar leitor de câmera real quando estiver no modo câmera
  useEffect(() => {
    if (manualMode || status === 'success' || status === 'processing') {
      stopCamera()
      return
    }

    let isMounted = true

    async function startCamera() {
      setCameraError(null)
      try {
        const { Html5Qrcode } = await import('html5-qrcode')

        if (!isMounted) return

        // Se já existe uma instância ativa, para antes de re-inicializar
        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.stop()
          } catch {
            // ignorar se já parado
          }
        }

        const html5QrCode = new Html5Qrcode(scannerContainerId)
        html5QrCodeRef.current = html5QrCode

        const config = { fps: 10, qrbox: { width: 250, height: 250 } }

        // Preferir câmera traseira (environment) em dispositivos móveis
        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText: string) => {
            // Sucesso na leitura do QR Code
            if (isMounted) {
              stopCamera()
              handleValidate(decodedText)
            }
          },
          () => {
            // leitor em busca contínua, ignorar erros pontuais de enquadramento
          }
        )
      } catch (err: any) {
        console.warn('Erro ao inicializar câmera:', err)
        if (isMounted) {
          setCameraError(
            'Não foi possível acessar a câmera do dispositivo. Verifique as permissões do navegador ou digite a chave manualmente.'
          )
        }
      }
    }

    // Pequeno atraso para garantir que a div #qr-reader esteja no DOM
    const timer = setTimeout(() => {
      startCamera()
    }, 300)

    return () => {
      isMounted = false
      clearTimeout(timer)
      stopCamera()
    }
  }, [manualMode, status])

  function stopCamera() {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop()
        }
      } catch {
        // ignorar se a câmera já estava parada
      }
      html5QrCodeRef.current = null
    }
  }

  async function handleValidate(input: string) {
    if (!input.trim()) {
      setErrorMessage('Digite ou cole a chave de acesso da NFC-e.')
      return
    }

    setStatus('processing')
    setErrorMessage(null)

    try {
      const res = await fetch('/api/fiscal/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput: input }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMessage(data.error || 'Não foi possível validar a nota fiscal.')
        return
      }

      setStatus('success')
      setSuccessData({
        points: data.pointsGranted,
        value: data.totalValue,
        key: data.accessKey,
      })
    } catch (err) {
      setStatus('error')
      setErrorMessage('Erro de conexão com o servidor. Tente novamente.')
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    handleValidate(accessKey)
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
                Nota fiscal de R$ {successData.value} validada com sucesso.
              </p>
              <span className="text-[10px] font-mono text-[var(--text-secondary)] block">
                Chave: {successData.key.substring(0, 10)}...{successData.key.substring(34)}
              </span>
            </div>
            <div className="pt-4 flex flex-col gap-2">
              <Link
                href="/carteira"
                className="w-full py-3 px-4 rounded-2xl bg-[var(--brand-primary)] text-white font-bold text-sm text-center shadow-md hover:bg-[var(--brand-primary-dark)] transition-colors"
              >
                Ver Saldo na Carteira
              </Link>
              <button
                onClick={() => {
                  setStatus('idle')
                  setAccessKey('')
                  setSuccessData(null)
                  setErrorMessage(null)
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

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {!manualMode ? (
              /* Leitor de Câmera Real (HTML5 QR Code) */
              <div className="space-y-4 text-center">
                {cameraError ? (
                  <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                    <p className="text-xs text-amber-900 leading-relaxed">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => setManualMode(true)}
                      className="px-4 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-xs font-bold shadow-xs hover:bg-[var(--brand-primary-dark)] transition-colors inline-flex items-center gap-1.5"
                    >
                      <Keyboard className="w-4 h-4" />
                      <span>Digitar Chave de 44 Dígitos</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative aspect-square max-w-xs mx-auto rounded-3xl overflow-hidden bg-black border-4 border-[var(--brand-primary)]/30 shadow-inner">
                      <div id={scannerContainerId} className="w-full h-full" />
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Aponte a câmera para o QR Code da nota fiscal impressa no seu cupom.
                    </p>
                  </>
                )}
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
                    placeholder="Cole ou digite a chave de acesso (ex: 32260802982922000177650010000184211000041300)"
                    className="w-full p-3.5 rounded-2xl border border-[var(--border)] text-xs font-mono focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all resize-none"
                  />
                  <span className="text-[10px] text-[var(--text-secondary)] mt-1 block">
                    {accessKey.replace(/\D/g, '').length} / 44 dígitos
                  </span>
                </div>

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
