import type { ReactNode } from 'react'
import { AuthStatus } from './auth-status'
import { BottomNav } from './bottom-nav'

export function AppShell({
  children,
  showAuth = true,
  showNav = true,
}: {
  children: ReactNode
  showAuth?: boolean
  showNav?: boolean
}) {
  return (
    <div className="flex min-h-dvh justify-center bg-background">
      <div className="flex min-h-dvh w-full max-w-md flex-col bg-background">
        {showAuth && <AuthStatus />}
        <main className="flex-1 px-5 pb-10 pt-8">{children}</main>
        {showNav && <BottomNav />}
      </div>
    </div>
  )
}
