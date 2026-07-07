import type { ReactNode } from 'react'
import { AuthStatus } from './auth-status'
import { BottomNav } from './bottom-nav'

/**
 * スマホ幅を前提にしたアプリの外枠。
 * 中央に max-w-md のカラムを置き、下にナビを固定する。
 */
export function AppShell({
  children,
  showNav = true,
}: {
  children: ReactNode
  showNav?: boolean
}) {
  return (
    <div className="flex min-h-dvh justify-center bg-background">
      <div className="flex min-h-dvh w-full max-w-md flex-col bg-background">
        <AuthStatus />
        <main className="flex-1 px-5 pb-10 pt-8">{children}</main>
        {showNav && <BottomNav />}
      </div>
    </div>
  )
}
