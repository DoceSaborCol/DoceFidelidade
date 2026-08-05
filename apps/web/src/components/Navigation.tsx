'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Wallet, QrCode, Gift, User, IceCream } from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()

  // Não exibir navegação pública/interna no login/cadastro se for tela limpa, ou exibir simples
  const isAuthPage = pathname === '/login' || pathname === '/cadastro'
  if (isAuthPage) return null

  const navItems = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/carteira', label: 'Carteira', icon: Wallet },
    { href: '/escanear', label: 'Escanear', icon: QrCode, isPrimary: true },
    { href: '/beneficios', label: 'Benefícios', icon: Gift },
    { href: '/perfil', label: 'Perfil', icon: User },
  ]

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[var(--border)] shadow-xs">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-[var(--brand-primary)] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <IceCream className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-[var(--text-primary)] block leading-tight">Doce Sabor</span>
              <span className="text-xs text-[var(--brand-primary)] font-medium block -mt-0.5">Sorvetes Soft • Fidelidade</span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                      : 'text-[var(--text-primary)] hover:bg-[var(--brand-surface)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-surface)] transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)] transition-colors shadow-xs"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation (máximo 5 destinos conforme Contexto Mestre 7.1) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-[var(--border)] px-4 py-2 safe-area-pb shadow-lg">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            if (item.isPrimary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center -mt-5 group"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[var(--brand-primary-dark)] to-[var(--brand-primary)] text-white flex items-center justify-center shadow-lg shadow-[var(--brand-primary)]/30 group-active:scale-95 transition-transform border-4 border-[var(--brand-surface)]">
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-semibold text-[var(--brand-primary)] mt-0.5">
                    {item.label}
                  </span>
                </Link>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-[var(--brand-primary)] font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[11px] mt-1">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
