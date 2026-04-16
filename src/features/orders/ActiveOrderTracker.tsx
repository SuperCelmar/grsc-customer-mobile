import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { OrderStatusStepper } from './OrderStatusStepper'

type Props = { orderId: string }

const STATUS_LABELS: Record<string, string> = {
  pending: 'Processing your order...',
  accepted: 'Order accepted by the store',
  preparing: 'Your order is being prepared',
  food_ready: 'Your order is ready for pickup!',
  dispatched: 'Your order is on the way',
  delivered: 'Order delivered',
  completed: 'Order complete',
  cancelled: 'Order cancelled',
}

const TERMINAL = new Set(['completed', 'delivered', 'cancelled'])

export function ActiveOrderTracker({ orderId }: Props) {
  const [status, setStatus] = useState<string>('pending')
  const [reconnecting, setReconnecting] = useState(false)
  const [sourceOrderId, setSourceOrderId] = useState<string | null>(null)

  // Fetch initial state
  useEffect(() => {
    supabase
      .from('orders')
      .select('order_status, source_order_id')
      .eq('order_id', orderId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setStatus(data.order_status || 'pending')
          setSourceOrderId(data.source_order_id)
        }
      })
  }, [orderId])

  // Realtime subscription
  useEffect(() => {
    if (TERMINAL.has(status)) return

    const channel = supabase
      .channel('order-' + orderId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `order_id=eq.${orderId}`,
        },
        (payload: any) => {
          const newStatus = payload.new?.order_status
          if (newStatus) {
            setStatus(newStatus)
            if (TERMINAL.has(newStatus)) channel.unsubscribe()
          }
        }
      )
      .subscribe((state: string) => {
        if (state === 'CHANNEL_ERROR') setReconnecting(true)
        if (state === 'SUBSCRIBED') {
          setReconnecting(false)
          // Re-fetch to catch any missed updates
          supabase
            .from('orders')
            .select('order_status')
            .eq('order_id', orderId)
            .maybeSingle()
            .then(({ data }) => {
              if (data?.order_status) setStatus(data.order_status)
            })
        }
      })

    return () => { channel.unsubscribe() }
  }, [orderId, status])

  const isCancelled = status === 'cancelled'

  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: 'var(--card)', backgroundColor: 'var(--muted)' }}
    >
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-sm font-semibold text-[var(--text)]">
          {sourceOrderId || 'Active Order'}
        </h3>
        {reconnecting && (
          <span className="text-xs text-[var(--text-secondary)]">Reconnecting...</span>
        )}
      </div>
      <p className="text-xs mb-3" style={{ color: isCancelled ? '#B42C1F' : 'var(--text-secondary)' }}>
        {STATUS_LABELS[status] || status}
      </p>
      <OrderStatusStepper status={status} />
    </div>
  )
}
