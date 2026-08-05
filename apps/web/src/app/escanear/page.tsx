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
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [successData, setSuccessData] = useState<{ points: number; value: string; key: string } | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Iniciar fluxo nativo de câmera com navigator.mediaDevices.getUserMedia
  useEffect(() => {
    if (manualMode || status === 'success' || status === 'processing') {
      stopNativeCamera()
      return
    }

    let isMounted = true

    async function initCameraStream() {
      setCameraError(null)
      setIsCameraActive(false)

      // Verificar suporte do navegador para câmera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isMounted) {
          setCameraError(
            'Seu navegador ou dispositivo não suporta acesso à câmera via Web. Utilize a opção "Digitar Chave".'
          )
        }
        return
      }

      try {
        // Solicitar stream de vídeo da câmera traseira (ideal: environment)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setIsCameraActive(true)
          startBarcodeDetection()
        }
      } catch (err: any) {
        console.warn('Erro ao solicitar stream de câmera:', err)
        if (!isMounted) return

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError(
            'Permissão de câmera negada. Permita o acesso à câmera nas configurações do seu navegador e recarregue a página.'
          )
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError('Nenhuma câmera encontrada no seu dispositivo.')
        } else {
          setCameraError(
            `Erro ao iniciar a câmera (${err.message || 'Falha de inicialização'}). Alterne para "Digitar Chave".`
          )
        }
      }
    }

    initCameraStream()

    return () => {
      isMounted = false
      stopNativeCamera()
    }
  }, [manualMode, status])

  function stopNativeCamera() {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsCameraActive(false)
  }

  // BarcodeDetector nativo dos navegadores modernos (Chrome, Edge, Android Webview)
  function startBarcodeDetection() {
    if (typeof window === 'undefined') return

    // Se o navegador suporta BarcodeDetector nativo (W3C Web API)
    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code'],
        })

        const detectLoop = async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current)
              if (barcodes && barcodes.length > 0) {
                const qrValue = barcodes[0].rawValue
                if (qrValue) {
                  stopNativeCamera()
                  handleValidate(qrValue)
                  return
                }
              }
            } catch {
              // ignora falhas de detecção em frames isolados
            }
          }
          animationFrameRef.current = requestAnimationFrame(detectLoop)
        }

        animationFrameRef.current = requestAnimationFrame(detectLoop)
      } catch (err) {
        console.warn('BarcodeDetector nativo indisponível:', err)
      }
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
              /* Feed de Vídeo Nativo do Navegador (getUserMedia) */
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
                    <div className="relative aspect-square max-w-xs mx-auto rounded-3xl overflow-hidden bg-slate-950 border-4 border-[var(--brand-primary)]/40 shadow-xl flex items-center justify-center">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />

                      {/* Moldura de leitor de QR Code */}
                      <div className="absolute inset-8 border-2 border-dashed border-white/80 rounded-2xl pointer-events-none animate-pulse flex items-center justify-center">
                        <div className="w-full h-0.5 bg-[var(--brand-primary)] opacity-60 shadow-lg animate-bounce" />
                      </div>

                      {!isCameraActive && (
                        <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-2 text-white p-4">
                          <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
                          <span className="text-xs font-medium">Iniciando Câmera...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Aponte a câmera para o QR Code da nota fiscal da Doce Sabor.
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
