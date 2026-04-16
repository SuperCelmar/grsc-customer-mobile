import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthContextType = {
  session: Session | null
  loading: boolean
  // DEV-only: bypass Supabase auth when Twilio isn't configured
  setDevSession: (phone: string) => void
}
const AuthContext = createContext<AuthContextType>({ session: null, loading: true, setDevSession: () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // DEV-only: create a mock session so ProtectedRoute passes and the UI is testable
  // without Twilio. Authenticated API calls will return 401 — that's expected.
  const setDevSession = (phone: string) => {
    if (!import.meta.env.DEV) return
    const mock = {
      access_token: 'dev-bypass',
      refresh_token: '',
      expires_in: 999999,
      token_type: 'bearer',
      user: { id: 'dev-user', phone: `+91${phone}`, aud: 'authenticated', role: 'authenticated', created_at: new Date().toISOString(), app_metadata: {}, user_metadata: {} },
    } as unknown as Session
    setSession(mock)
    setLoading(false)
    try { sessionStorage.setItem('grsc_dev_session', '1') } catch {}
  }

  return <AuthContext.Provider value={{ session, loading, setDevSession }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
