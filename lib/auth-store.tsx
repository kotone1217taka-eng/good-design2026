'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { firebaseAuth, isFirebaseConfigured } from './firebase'

type AuthContextValue = {
  configured: boolean
  loading: boolean
  user: User | null
  error: string
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const REDIRECT_FALLBACK_CODES = new Set([
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment',
  'auth/popup-blocked',
])

function getErrorCode(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return ''
  }

  const { code } = error as { code?: unknown }
  return typeof code === 'string' ? code : ''
}

function shouldStartWithRedirect(): boolean {
  if (typeof navigator === 'undefined') return false

  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function shouldFallbackToRedirect(error: unknown): boolean {
  return REDIRECT_FALLBACK_CODES.has(getErrorCode(error))
}

function toMessage(error: unknown): string {
  const code = getErrorCode(error)

  if (code === 'auth/unauthorized-domain') {
    return 'この公開URLがGoogleログインの許可ドメインに入っていない可能性があります。Firebase Consoleで kotone1217taka-eng.github.io を追加してください。'
  }

  if (code === 'auth/operation-not-allowed') {
    return 'Firebase AuthenticationでGoogleログインが有効になっていません。Googleログインを有効にしてください。'
  }

  if (code === 'auth/popup-closed-by-user') {
    return 'Googleログイン画面が閉じられました。もう一度サインインしてください。'
  }

  if (REDIRECT_FALLBACK_CODES.has(code)) {
    return 'ポップアップでサインインできませんでした。画面遷移でサインインし直します。'
  }

  if (error instanceof Error) return error.message
  return 'サインインに失敗しました。'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false)
      return
    }

    void getRedirectResult(firebaseAuth).catch((nextError) => {
      setError(toMessage(nextError))
    })

    return onAuthStateChanged(
      firebaseAuth,
      (nextUser) => {
        setUser(nextUser)
        setLoading(false)
      },
      (nextError) => {
        setError(toMessage(nextError))
        setLoading(false)
      },
    )
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!firebaseAuth) {
      setError('Firebaseの環境変数が未設定です。')
      return
    }

    setError('')
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    try {
      if (shouldStartWithRedirect()) {
        await signInWithRedirect(firebaseAuth, provider)
        return
      }

      await signInWithPopup(firebaseAuth, provider)
    } catch (nextError) {
      if (shouldFallbackToRedirect(nextError)) {
        await signInWithRedirect(firebaseAuth, provider)
        return
      }

      setError(toMessage(nextError))
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!firebaseAuth) return

    setError('')
    try {
      await firebaseSignOut(firebaseAuth)
    } catch (nextError) {
      setError(toMessage(nextError))
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isFirebaseConfigured,
      loading,
      user,
      error,
      signInWithGoogle,
      signOut,
    }),
    [loading, user, error, signInWithGoogle, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
