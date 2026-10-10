import { useEffect, useState,type ReactNode } from 'react'
import { getCurrentUser } from '../api/userAuth'
import type { CurrentUser } from '../api/userAuth'
import { AuthContext } from './authContext'

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getCurrentUser()
      .then((current) => {
        if (!cancelled) setUser(current)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function refresh() {
    const current = await getCurrentUser()
    setUser(current)
  }

  return <AuthContext.Provider value={{ user, loading, setUser, refresh }}>{children}</AuthContext.Provider>
}