import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { AuthProvider } from '@/lib/auth-store'
import { RecordsProvider } from '@/lib/records-store'

export const metadata: Metadata = {
  title: 'フトショット',
  description: 'ふと撮る、日々が見えてくる。',
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
