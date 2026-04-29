import { supabase } from '../../lib/supabase'
import type { CafeCartItem } from '../../contexts/CartContext'

const STORAGE_KEY = 'grsc_cashfree_session'
const SESSION_TTL_MS = 15 * 60 * 1000 // 15 minutes — Cashfree sessions expire after that

export interface PersistedCashfreeSession {
  order_id: string
  payment_session_id: string
  expires_at: number
  cart_hash: string
  phone: string
}

export function cartHash(items: CafeCartItem[]): string {
  return items
    .slice()
    .sort((a, b) => a.productId.localeCompare(b.productId))
    .map(i => `${i.productId}:${i.quantity}:${i.addons.map(a => a.id).sort().join(',')}`)
    .join('|')
}

function storageKey(phone: string): string {
  return `${STORAGE_KEY}:${phone}`
}

export function saveSession(phone: string, session: Omit<PersistedCashfreeSession, 'phone' | 'expires_at'>): void {
  const entry: PersistedCashfreeSession = {
    ...session,
    phone,
    expires_at: Date.now() + SESSION_TTL_MS,
  }
  try {
    localStorage.setItem(storageKey(phone), JSON.stringify(entry))
  } catch { /* localStorage unavailable */ }
}

export function loadSession(phone: string): PersistedCashfreeSession | null {
  try {
    const raw = localStorage.getItem(storageKey(phone))
    if (!raw) return null
    const entry = JSON.parse(raw) as PersistedCashfreeSession
    if (entry.expires_at < Date.now()) {
      localStorage.removeItem(storageKey(phone))
      return null
    }
    return entry
  } catch {
    return null
  }
}

export function loadSessionByOrderId(orderId: string): PersistedCashfreeSession | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(STORAGE_KEY + ':')) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const entry = JSON.parse(raw) as PersistedCashfreeSession
      if (entry.order_id === orderId) {
        if (entry.expires_at < Date.now()) {
          localStorage.removeItem(key)
          return null
        }
        return entry
      }
    }
    return null
  } catch {
    return null
  }
}

export function clearSession(phone: string): void {
  try {
    localStorage.removeItem(storageKey(phone))
  } catch { /* localStorage unavailable */ }
}

export function clearSessionByOrderId(orderId: string): void {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(STORAGE_KEY + ':')) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const entry = JSON.parse(raw) as PersistedCashfreeSession
      if (entry.order_id === orderId) {
        localStorage.removeItem(key)
        return
      }
    }
  } catch { /* localStorage unavailable */ }
}

// Call once at app startup — clears all persisted sessions on logout
export function registerCashfreeSessionLogoutClear(): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      try {
        const toRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith(STORAGE_KEY + ':')) toRemove.push(key)
        }
        toRemove.forEach(k => localStorage.removeItem(k))
      } catch { /* localStorage unavailable */ }
    }
  })
  return () => subscription.unsubscribe()
}
