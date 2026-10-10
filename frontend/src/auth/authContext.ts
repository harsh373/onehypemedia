import { createContext, useContext } from 'react'
import type { CurrentUser } from '../api/userAuth'

export type AuthState = {
  user: CurrentUser | null
  loading: boolean
  setUser: (user: CurrentUser | null) => void
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useUserAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useUserAuth must be used inside UserAuthProvider')
  return ctx
}