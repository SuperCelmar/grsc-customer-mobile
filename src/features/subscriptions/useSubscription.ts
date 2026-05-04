/**
 * useSubscription — single active subscription state hook
 *
 * Data source: useSubscriptions() (React Query → api.getSubscriptions)
 * QA override:  append ?subState=none|active|paused|expired to the URL to force a mock state
 *               without needing real backend data. Critical for AC-7 visual testing.
 *
 * Exported by this module:
 *   SubscriptionState   — canonical shape consumed by all tabs
 *   useSubscription()   — returns SubscriptionState | null (null = no active/paused sub)
 *   useSubscriptionActions() — stub action handlers (Phase 3.5 backend TODO)
 */

import { useMemo } from 'react'
import { useSubscriptions } from './useSubscriptions'
import type { SubscriptionStatus, SubscriptionInterval } from '../../lib/api'

// ── Public shape ───────────────────────────────────────────────────────────────

export interface SubscriptionState {
  id: string
  /** Normalised status — 'expired' maps to both past_due and cancelled_payment_failed */
  status: 'none' | 'active' | 'paused' | 'expired' | 'cancelled'
  productId: string | null
  productName: string | null
  productImage: string | null
  interval: SubscriptionInterval | null
  interval_count: number | null
  /** "biweekly" | "monthly" — derived from interval + interval_count */
  frequency: 'biweekly' | 'monthly' | null
  nextShipAt: Date | null
  /** 48 hr before nextShipAt */
  editByDeadline: Date | null
  hoursUntilNextShip: number | null
  hoursUntilEditDeadline: number | null
  /** Whether edit-by window is currently active (deadline within 48hr and not yet passed) */
  inEditWindow: boolean
  /** Sum of past discount amounts — not yet available from backend; null until Phase 3.5 */
  savingsToDate: number | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function hoursUntil(date: Date): number {
  return (date.getTime() - Date.now()) / (1000 * 60 * 60)
}

function normaliseStatus(raw: SubscriptionStatus): SubscriptionState['status'] {
  if (raw === 'active') return 'active'
  if (raw === 'paused') return 'paused'
  if (raw === 'past_due' || raw === 'cancelled_payment_failed') return 'expired'
  return 'cancelled'
}

function deriveFrequency(interval: SubscriptionInterval, count: number): 'biweekly' | 'monthly' | null {
  if (interval === 'week' && count === 2) return 'biweekly'
  if (interval === 'month' && count === 1) return 'monthly'
  return null
}

// ── QA mock data ───────────────────────────────────────────────────────────────

const MOCK_NEXT_SHIP = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) // 4 days from now
const MOCK_NEXT_SHIP_EDIT_WINDOW = new Date(Date.now() + 30 * 60 * 60 * 1000) // 30hr (inside 48hr window)

function buildMock(status: SubscriptionState['status'], editWindow = false): SubscriptionState {
  const nextShipAt = editWindow ? MOCK_NEXT_SHIP_EDIT_WINDOW : MOCK_NEXT_SHIP
  const editByDeadline = new Date(nextShipAt.getTime() - 48 * 60 * 60 * 1000)
  const hoursUntilNextShip = hoursUntil(nextShipAt)
  const hoursUntilEditDeadline = hoursUntil(editByDeadline)
  return {
    id: 'mock-sub-001',
    status,
    productId: 'mock-product-001',
    productName: 'GoldRush Performance Blend',
    productImage: null,
    interval: 'week',
    interval_count: 2,
    frequency: 'biweekly',
    nextShipAt,
    editByDeadline,
    hoursUntilNextShip,
    hoursUntilEditDeadline,
    inEditWindow: hoursUntilNextShip > 0 && hoursUntilNextShip <= 48,
    savingsToDate: 240,
  }
}

const QA_MOCKS: Record<string, SubscriptionState | null> = {
  none: null,
  active: buildMock('active'),
  'active-edit-window': buildMock('active', true),
  paused: buildMock('paused'),
  expired: buildMock('expired'),
}

function getQAOverride(): SubscriptionState | null | undefined {
  try {
    const params = new URLSearchParams(window.location.search)
    const subState = params.get('subState')
    if (subState && subState in QA_MOCKS) return QA_MOCKS[subState]
  } catch {
    // Non-browser env
  }
  return undefined // undefined = no override
}

// ── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Returns the first non-cancelled subscription as SubscriptionState, or null.
 * Priority: active > paused > past_due > cancelled_payment_failed
 * Falls back to QA mock if ?subState= query param is present.
 */
export function useSubscription(): SubscriptionState | null {
  const { data } = useSubscriptions()

  return useMemo(() => {
    const qa = getQAOverride()
    if (qa !== undefined) return qa

    const subs = data?.subscriptions ?? []
    // Pick most relevant: active first, then paused, then expired
    const priority: SubscriptionStatus[] = ['active', 'paused', 'past_due', 'cancelled_payment_failed']
    let found = null
    for (const p of priority) {
      found = subs.find(s => s.status === p) ?? null
      if (found) break
    }
    if (!found) return null

    const nextShipAt = new Date(found.next_shipment_at)
    const editByDeadline = new Date(nextShipAt.getTime() - 48 * 60 * 60 * 1000)
    const hoursUntilNextShip = hoursUntil(nextShipAt)
    const hoursUntilEditDeadline = hoursUntil(editByDeadline)

    return {
      id: found.id,
      status: normaliseStatus(found.status),
      productId: found.product_id,
      productName: found.product_name,
      productImage: found.image_url,
      interval: found.interval,
      interval_count: found.interval_count,
      frequency: deriveFrequency(found.interval, found.interval_count),
      nextShipAt,
      editByDeadline,
      hoursUntilNextShip,
      hoursUntilEditDeadline,
      inEditWindow: hoursUntilNextShip > 0 && hoursUntilNextShip <= 48,
      savingsToDate: null,
    }
  }, [data])
}

// ── Action stubs ───────────────────────────────────────────────────────────────

/**
 * Stub action handlers — UI wired, backend calls stubbed for Phase 3.5.
 * Each action shows a dev toast and returns an optimistic promise after 300ms.
 */
export function useSubscriptionActions() {
  return {
    skipNext: async (subscriptionId: string): Promise<void> => {
      console.warn(
        'TODO Phase 3.5 backend: skip_next not implemented.',
        'Plan ref: subscription-page-ux-and-action-bar-cleverness.md Step 1',
        { subscriptionId }
      )
      await new Promise(r => setTimeout(r, 300))
    },

    changeFrequency: async (
      subscriptionId: string,
      interval: SubscriptionInterval,
      interval_count: number
    ): Promise<void> => {
      console.warn(
        'TODO Phase 3.5 backend: change_frequency not implemented.',
        { subscriptionId, interval, interval_count }
      )
      await new Promise(r => setTimeout(r, 300))
    },

    cancel: async (subscriptionId: string, reason?: string): Promise<void> => {
      console.warn(
        'TODO Phase 3.5 backend: cancel not implemented.',
        { subscriptionId, reason }
      )
      await new Promise(r => setTimeout(r, 300))
    },
  }
}
