'use client'

import { LogIn, LogOut, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-store'

export function AuthStatus() {
  const { configured, loading, user, error, signInWithGoogle, signOut } = useAuth()
  const [busy, setBusy] = useState(false)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    try {
      await action()
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="border-b border-border bg-card/70 px-5 py-3 text-xs text-muted-foreground">
        アカウントを確認しています。
      </div>
    )
  }

  if (!configured) {
    return (
      <div className="border-b border-destructive/20 bg-destructive/10 px-5 py-3 text-xs leading-relaxed text-destructive">
        Firebaseの環境変数が未設定です。写真の保存にはFirebase設定が必要です。
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card/70 px-5 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-card-foreground">未ログイン</p>
          <p className="truncate text-[11px] text-muted-foreground">
            写真日記はアカウントごとに保存されます。
          </p>
          {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
        </div>
        <Button
          type="button"
          size="sm"
          className="shrink-0 rounded-xl"
          disabled={busy}
          onClick={() => run(signInWithGoogle)}
        >
          <LogIn className="size-3.5" aria-hidden="true" />
          Googleでサインイン
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border bg-card/70 px-5 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt=""
            className="size-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <UserRound className="size-4" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-card-foreground">
            {user.displayName ?? 'サインイン中'}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <button
        type="button"
        aria-label="サインアウト"
        disabled={busy}
        onClick={() => run(signOut)}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
      >
        <LogOut className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
