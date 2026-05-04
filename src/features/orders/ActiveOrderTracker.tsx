import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { fetchOrderWithRetry } from './lib/fetchOrderWithRetry'

type FulfillmentStatus = 'PLACED' | 'CONFIRMED' | 'PACKED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED'

interface FulfillmentEvent {
  id: string
  to_state: FulfillmentStatus
  created_at: string
}

interface OrderState {
  fulfillment_status: FulfillmentStatus
  source_order_id: string | null
  payment_status: string | null
  events: FulfillmentEvent[]
}

type Props = {
  orderId: string
  // TODO (Phase 3.3): wire this to resume a persisted Cashfree payment session
  onResumePayment?: (orderId: string) => void
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const STEPS: { key: FulfillmentStatus; label: string; icon: string }[] = [
  { key: 'PLACED',     label: 'Placed',     icon: '📋' },
  { key: 'CONFIRMED',  label: 'Confirmed',  icon: '✅' },
  { key: 'PACKED',     label: 'Packed',     icon: '📦' },
  { key: 'DISPATCHED', label: 'On the way', icon: '🛵' },
  { key: 'DELIVERED',  label: 'Delivered',  icon: '🎉' },
]

const STEP_INDEX: Record<FulfillmentStatus, number> = {
  PLACED: 0, CONFIRMED: 1, PACKED: 2, DISPATCHED: 3, DELIVERED: 4, CANCELLED: -1,
}

const TERMINAL: Set<FulfillmentStatus> = new Set(['DELIVERED', 'CANCELLED'])
const CANCELLABLE: Set<FulfillmentStatus> = new Set(['PLACED', 'CONFIRMED'])
const CANCEL_CONFIRM_EVENT = 'grsc:order-cancel-confirm'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ActiveOrderTracker({ orderId, onResumePayment }: Props) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isValidId = UUID_RE.test(orderId) || orderId.startsWith('mock-')
  const isMockOrder = orderId.startsWith('mock-')
  const [order, setOrder] = useState<OrderState | null>(null)
  const [fetchDone, setFetchDone] = useState(!isValidId)
  const [reconnecting, setReconnecting] = useState(false)
  const [cancelState, setCancelState] = useState<'idle' | 'confirming' | 'cancelling'>('idle')

  useEffect(() => {
    function handleOtherConfirm(event: Event) {
      if ((event as CustomEvent<string>).detail !== orderId) {
        setCancelState(state => state === 'confirming' ? 'idle' : state)
      }
    }

    window.addEventListener(CANCEL_CONFIRM_EVENT, handleOtherConfirm)
    return () => window.removeEventListener(CANCEL_CONFIRM_EVENT, handleOtherConfirm)
  }, [orderId])

  const fetchOrder = useCallback(async () => {
    if (isMockOrder) {
      setOrder({ fulfillment_status: 'PLACED', source_order_id: null, payment_status: null, events: [] })
      setFetchDone(true)
      return
    }
    const data = await fetchOrderWithRetry(orderId)
    if (data) {
      setOrder({
        fulfillment_status: (data.fulfillment_status ?? 'PLACED') as FulfillmentStatus,
        source_order_id: data.source_order_id,
        payment_status: data.payment_status ?? null,
        events: (data.order_fulfillment_events ?? []) as FulfillmentEvent[],
      })
    } else {
      setOrder(null)
    }
    setFetchDone(true)
  }, [orderId, isMockOrder])

  useEffect(() => {
    if (!isValidId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrder()
  }, [isValidId, fetchOrder])

  const currentStatus = order?.fulfillment_status

  useEffect(() => {
    if (!isValidId || isMockOrder) return
    if (currentStatus && TERMINAL.has(currentStatus)) return

    const channel = supabase
      .channel('order-fulfillment-' + orderId)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `order_id=eq.${orderId}` },
        () => { fetchOrder() }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_fulfillment_events', filter: `order_id=eq.${orderId}` },
        () => { fetchOrder() }
      )
      .subscribe((state: string) => {
        if (state === 'CHANNEL_ERROR') setReconnecting(true)
        if (state === 'SUBSCRIBED') setReconnecting(false)
      })

    return () => { channel.unsubscribe() }
  }, [orderId, isMockOrder, isValidId, currentStatus, fetchOrder])

  async function handleCancel() {
    setCancelState('cancelling')
    try {
      await api.cancelOrder(orderId, 'Customer cancelled from app')
      toast.success('Order cancelled')
      setOrder(prev => prev
        ? {
            ...prev,
            fulfillment_status: 'CANCELLED',
            events: [
              ...prev.events,
              { id: `local-cancel-${orderId}`, to_state: 'CANCELLED', created_at: new Date().toISOString() },
            ],
          }
        : prev
      )
      setCancelState('idle')
      qc.invalidateQueries({ queryKey: ['customer-orders'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel order')
      // Refetch — if the order was already cancelled server-side, render the correct state
      await fetchOrder()
      setCancelState('idle')
    }
  }

  function handleStartCancelConfirm() {
    window.dispatchEvent(new CustomEvent(CANCEL_CONFIRM_EVENT, { detail: orderId }))
    setCancelState('confirming')
  }

  // Invalid UUID or order not found after fetch — show degraded null state
  if (!isValidId || (fetchDone && order === null)) {
    return (
      <div
        className="rounded-xl border p-4 text-center space-y-2"
        style={{ borderColor: 'var(--card)', backgroundColor: 'var(--muted)' }}
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Couldn't load this order — refresh or check Orders.
        </p>
        <button
          onClick={() => navigate('/orders')}
          className="text-sm font-medium"
          style={{ color: 'var(--primary)' }}
        >
          Go to Orders
        </button>
      </div>
    )
  }

  // Still loading
  if (!fetchDone || order === null) {
    return (
      <div
        className="rounded-xl border p-4 flex items-center justify-center"
        style={{ borderColor: 'var(--card)', backgroundColor: 'var(--muted)' }}
      >
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    )
  }

  const status = order.fulfillment_status
  const isCancelled = status === 'CANCELLED'
  const isAwaitingPayment = order.payment_status != null &&
    order.payment_status.toLowerCase() === 'pending'
  const currentIndex = STEP_INDEX[status] ?? 0

  const eventsByState: Record<string, string> = {}
  for (const ev of order.events) {
    eventsByState[ev.to_state] = ev.created_at
  }

  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: 'var(--card)', backgroundColor: 'var(--muted)' }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-sm font-semibold text-[var(--text)]">
          {order.source_order_id || 'Active Order'}
        </h3>
        {reconnecting && (
          <span className="text-xs text-[var(--text-secondary)]">Reconnecting...</span>
        )}
      </div>

      {isCancelled ? (
        <div className="flex items-center justify-center py-4">
          <div
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: '#FEE2E2', color: '#B42C1F' }}
          >
            Order Cancelled
          </div>
        </div>
      ) : isAwaitingPayment ? (
        <div className="py-3 space-y-2">
          <p className="text-sm text-[var(--text-secondary)]">Awaiting payment</p>
          {/* TODO (Phase 3.3): onResumePayment wires to persisted Cashfree session in localStorage */}
          <button
            onClick={() => onResumePayment?.(orderId)}
            disabled={!onResumePayment}
            className="text-sm font-medium disabled:opacity-40"
            style={{ color: 'var(--primary)' }}
          >
            Resume payment
          </button>
        </div>
      ) : (<>

        <div className="py-3">
          <div className="flex items-start">
            {STEPS.map((step, i) => {
              const done = i < currentIndex
              const active = i === currentIndex
              const timestamp = eventsByState[step.key]
              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{
                        backgroundColor: done || active ? 'var(--primary)' : 'var(--card)',
                        color: done || active ? 'white' : 'var(--text-secondary)',
                      }}
                    >
                      {done ? '✓' : step.icon}
                    </div>
                    <span
                      className="text-xs mt-1 text-center w-14 leading-tight"
                      style={{
                        color: active ? 'var(--primary)' : done ? 'var(--text)' : 'var(--text-secondary)',
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {step.label}
                    </span>
                    {timestamp && (
                      <span className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>
                        {formatTime(timestamp)}
                      </span>
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className="flex-1 h-0.5 mb-6 mx-0.5"
                      style={{ backgroundColor: done ? 'var(--primary)' : 'var(--card)' }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
        {CANCELLABLE.has(status) && (
          <div className="pt-2 border-t border-[var(--card)]">
            {cancelState === 'confirming' ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[var(--text-secondary)]">Cancel this order?</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCancelState('idle')}
                    className="text-xs font-medium px-3 py-1.5 rounded-md border border-[var(--card)] text-[var(--text-secondary)]"
                  >
                    Keep
                  </button>
                  <button
                    onClick={handleCancel}
                    className="text-xs font-medium px-3 py-1.5 rounded-md text-white"
                    style={{ backgroundColor: '#B42C1F' }}
                  >
                    Yes, cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleStartCancelConfirm}
                disabled={cancelState === 'cancelling'}
                className="text-xs font-medium disabled:opacity-50"
                style={{ color: '#B42C1F' }}
              >
                {cancelState === 'cancelling' ? 'Cancelling…' : 'Cancel order'}
              </button>
            )}
          </div>
        )}
      </>)}
    </div>
  )
}
