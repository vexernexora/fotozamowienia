import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin', 'latin-ext'] })

export const metadata: Metadata = {
  title: 'FotoDruk - Profesjonalny wydruk zdjec online',
  description: 'Zamow wydruk zdjec online. Odbitki, plakaty, fotoalbumy i obrazy na plotnie. Szybka realizacja i wysoka jakosc.',
  keywords: 'wydruk zdjec, odbitki, plakaty, fotoalbum, zdjecia online',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
