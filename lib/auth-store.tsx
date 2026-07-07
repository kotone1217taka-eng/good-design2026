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
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
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

function toMessage(error: unknown): string {
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
      await signInWithPopup(firebaseAuth, provider)
    } catch (nextError) {
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
