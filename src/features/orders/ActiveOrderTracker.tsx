import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type FulfillmentStatus = 'PLACED' | 'CONFIRMED' | 'PACKED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED'

interface FulfillmentEvent {
  id: string
  to_state: FulfillmentStatus
  created_at: string
}

interface OrderState {
  fulfillment_status: FulfillmentStatus
  source_order_id: string | null
  events: FulfillmentEvent[]
}

type Props = { orderId: string }

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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ActiveOrderTracker({ orderId }: Props) {
  const [order, setOrder] = useState<OrderState>({
    fulfillment_status: 'PLACED',
    source_order_id: null,
    events: [],
  })
  const [reconnecting, setReconnecting] = useState(false)

  async function fetchOrder() {
    const { data } = await supabase
      .from('orders')
      .select(`
        fulfillment_status,
        source_order_id,
        order_fulfillment_events (id, to_state, created_at)
      `)
      .eq('order_id', orderId)
      .order('created_at', { referencedTable: 'order_fulfillment_events', ascending: true })
      .maybeSingle()

    if (data) {
      setOrder({
        fulfillment_status: (data.fulfillment_status ?? 'PLACED') as FulfillmentStatus,
        source_order_id: data.source_order_id,
        events: (data.order_fulfillment_events ?? []) as FulfillmentEvent[],
      })
    }
  }

  useEffect(() => { fetchOrder() }, [orderId])

  useEffect(() => {
    if (TERMINAL.has(order.fulfillment_status)) return

    const channel = supabase
      .channel('order-fulfillment-' + orderId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `order_id=eq.${orderId}`,
        },
        () => { fetchOrder() }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_fulfillment_events',
          filter: `order_id=eq.${orderId}`,
        },
        () => { fetchOrder() }
      )
      .subscribe((state: string) => {
        if (state === 'CHANNEL_ERROR') setReconnecting(true)
        if (state === 'SUBSCRIBED') {
          setReconnecting(false)
          fetchOrder()
        }
      })

    return () => { channel.unsubscribe() }
  }, [orderId, order.fulfillment_status])

  const status = order.fulfillment_status
  const isCancelled = status === 'CANCELLED'
  const currentIndex = STEP_INDEX[status] ?? 0

  const eventsByState: Record<string, string> = {}
  for (const ev of order.events) {
    eventsByState[ev.to_state] = ev.created_at
  }

  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: 'var(--card)', backgroundColor: 'var(--muted)' }}
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
      ) : (
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
      )}
    </div>
  )
}
