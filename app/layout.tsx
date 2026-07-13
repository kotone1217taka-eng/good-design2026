import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { AuthProvider } from '@/lib/auth-store'
import { RecordsProvider } from '@/lib/records-store'

export const metadata: Metadata = {
  title: '30秒の余白。同じ毎日を、記憶に残る一日に。',
  description:
    '30秒で撮った写真と声から、AIが背景や小さな違和感を読み取り、同じ毎日を記憶に残すアプリ。',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#fbf4e2',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="ja" className="bg-background">
      <body className="font-sans antialiased">
        <AuthProvider>
          <RecordsProvider>{children}</RecordsProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
