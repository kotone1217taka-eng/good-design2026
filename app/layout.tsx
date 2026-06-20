import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { RecordsProvider } from '@/lib/records-store'

export const metadata: Metadata = {
  title: 'きょうの余白 — もう朝だ、の前に。',
  description:
    '1日1枚の写真と、少しの声。AIが今日を静かに観察し、新しい発見の鍵を返してくれる、運動部生のための観察日記。',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#eef1f6',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ja"
      className="bg-background"
    >
      <body className="font-sans antialiased">
        <RecordsProvider>{children}</RecordsProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
