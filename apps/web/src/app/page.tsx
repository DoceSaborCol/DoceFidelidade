import Link from 'next/link'
import { QrCode, Gift, Sparkles, Award, ArrowRight, ShieldCheck, Instagram, ChevronRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Hero / Balance Card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--brand-primary)] via-[#E85A24] to-[#C74E1A] text-white p-6 sm:p-8 shadow-xl shadow-[var(--brand-primary)]/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
              <span>Programa Oficial • Doce Sabor Colatina</span>
            </div>
            <span className="text-xs font-medium bg-black/20 px-2.5 py-1 rounded-lg">
              Nível Bronze
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-white/80 font-medium">Seu saldo atual</p>
            <div className="flex items-baseline gap-2">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight">0</h1>
              <span className="text-xl font-bold text-[var(--brand-accent)]">pontos</span>
            </div>
            <p className="text-xs text-white/80">
              Equivale a <strong className="text-white font-bold">R$ 0,00</strong> em descontos de sorvete soft
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/escanear"
              className="flex-1 py-3.5 px-6 rounded-2xl bg-white text-[var(--brand-primary)] font-bold text-sm text-center shadow-lg hover:bg-[var(--brand-surface)] transition-all flex items-center justify-center gap-2 group"
            >
              <QrCode className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Escanear Cupom Fiscal (NFC-e)
            </Link>
            <Link
              href="/carteira"
              className="py-3.5 px-6 rounded-2xl bg-black/20 hover:bg-black/30 backdrop-blur-md text-white font-semibold text-sm text-center transition-colors flex items-center justify-center gap-1.5"
            >
              Ver Carteira
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Regra de Acúmulo & Resgate */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[var(--border)] shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-surface)] text-[var(--brand-primary)] flex items-center justify-center font-bold">
            1
          </div>
          <h3 className="font-bold text-base text-[var(--text-primary)]">Como acumular</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            A cada <strong className="text-[var(--brand-primary)]">R$ 8,00</strong> em compras na Doce Sabor, peça o CPF na nota e escaneie a NFC-e para ganhar <strong className="text-[var(--brand-primary)]">1 Ponto</strong>.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[var(--border)] shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            2
          </div>
          <h3 className="font-bold text-base text-[var(--text-primary)]">Como resgatar</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Cada <strong className="text-amber-600">1 Ponto</strong> vale <strong className="text-amber-600">R$ 1,00</strong> de desconto na sua sobremesa. Resgate a partir de 8 pontos (R$ 8,00 de desconto).
          </p>
        </div>
      </section>

      {/* Recompensas em Destaque */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Recompensas Disponíveis</h2>
            <p className="text-xs text-[var(--text-secondary)]">Troque seus pontos no caixa da loja</p>
          </div>
          <Link href="/beneficios" className="text-xs font-semibold text-[var(--brand-primary)] hover:underline flex items-center gap-0.5">
            Ver todas <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-[var(--border)] space-y-3 hover:border-[var(--brand-primary)]/40 transition-colors">
            <div className="h-28 rounded-xl bg-gradient-to-tr from-amber-100 to-amber-50 flex items-center justify-center text-amber-600 font-black text-2xl">
              R$ 8,00 OFF
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">Desconto</span>
              <h4 className="font-bold text-sm text-[var(--text-primary)]">Desconto no Casquinha ou Cascão</h4>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs font-semibold">
              <span className="text-[var(--text-secondary)]">Custo:</span>
              <span className="text-[var(--brand-primary)] font-bold">8 pontos</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[var(--border)] space-y-3 hover:border-[var(--brand-primary)]/40 transition-colors">
            <div className="h-28 rounded-xl bg-gradient-to-tr from-orange-100 to-orange-50 flex items-center justify-center text-[var(--brand-primary)] font-black text-2xl">
              R$ 15,00 OFF
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">Desconto</span>
              <h4 className="font-bold text-sm text-[var(--text-primary)]">Desconto no Milk-shake 500ml</h4>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs font-semibold">
              <span className="text-[var(--text-secondary)]">Custo:</span>
              <span className="text-[var(--brand-primary)] font-bold">15 pontos</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[var(--border)] space-y-3 hover:border-[var(--brand-primary)]/40 transition-colors">
            <div className="h-28 rounded-xl bg-gradient-to-tr from-purple-100 to-purple-50 flex items-center justify-center text-purple-600 font-black text-2xl">
              R$ 20,00 OFF
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Desconto</span>
              <h4 className="font-bold text-sm text-[var(--text-primary)]">Desconto no Açaí Especial</h4>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs font-semibold">
              <span className="text-[var(--text-secondary)]">Custo:</span>
              <span className="text-purple-600 font-bold">20 pontos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Banner Bônus Instagram */}
      <section className="p-6 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold">
            <Instagram className="w-3.5 h-3.5" />
            <span>@docesaborcolatina</span>
          </div>
          <h3 className="text-lg font-bold">Siga a Doce Sabor no Instagram</h3>
          <p className="text-xs text-white/90">Acompanhe as novidades, sabores do dia e promoções relâmpago de Colatina.</p>
        </div>
        <a
          href="https://www.instagram.com/docesaborcolatina/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-xl bg-white text-pink-600 font-bold text-xs shadow-sm hover:bg-pink-50 transition-colors whitespace-nowrap"
        >
          Ver Instagram
        </a>
      </section>
    </div>
  )
}
