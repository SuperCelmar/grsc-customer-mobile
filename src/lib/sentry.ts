import * as Sentry from '@sentry/react'
import type { Session } from '@supabase/supabase-js'

const DSN = import.meta.env.VITE_SENTRY_DSN

export function initSentry(): void {
  if (!DSN) return
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    beforeSend(event, hint) {
      const err = hint?.originalException
      if (err instanceof DOMException && err.name === 'AbortError') return null
      const msg = typeof err === 'object' && err && 'message' in err ? String((err as Error).message) : ''
      if (msg.includes('The user aborted a request') || msg.includes('Failed to fetch')) return null
      return event
    },
  })
}

export function setSentryUser(session: Session | null): void {
  if (!DSN) return
  if (!session) {
    Sentry.setUser(null)
    return
  }
  Sentry.setUser({
    id: session.user.id,
    phone: session.user.phone,
  })
}
