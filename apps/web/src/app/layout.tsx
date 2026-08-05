import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Doce Sabor Fidelidade — Sorvetes Soft',
  description: 'Acumule pontos a cada compra de sorvete soft em Colatina e troque por descontos e recompensas exclusivas.',
  keywords: ['Doce Sabor', 'Fidelidade', 'Sorvetes Soft', 'Colatina', 'Açaí', 'Milkshake', 'Descontos'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} antialiased min-h-screen flex flex-col pb-20 md:pb-0`}>
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  )
}
