import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { AuthProvider } from '@/lib/auth-store'
import { RecordsProvider } from '@/lib/records-store'

export const metadata: Metadata = {
  title: '30秒の観察',
  description:
    'その場で撮った写真をAIが観察し、面白いと感じた点や気づきを個人的な記録として残すアプリ。',
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
