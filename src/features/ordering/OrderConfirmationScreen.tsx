import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { fetchOrderWithRetry } from '../orders/lib/fetchOrderWithRetry'

interface OrderSummary {
  source_order_id: string | null
  total_amount: number | null
  store_name: string | null
}

export function OrderConfirmationScreen() {
  const { orderId } = useParams<{ orderId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const secondaryOrderId = searchParams.get('secondary')

  const [summary, setSummary] = useState<OrderSummary | null>(null)

  useEffect(() => {
    if (!orderId) return
    fetchOrderWithRetry(orderId).then((data) => {
      if (data) {
        setSummary({
          source_order_id: data.source_order_id,
          total_amount: data.total_amount ?? null,
          store_name: data.store_name ?? null,
        })
      }
    })
  }, [orderId])

  const shortId = orderId ? orderId.slice(0, 8).toUpperCase() : ''

  return (
    <div
      className="flex flex-col min-h-screen items-center justify-center px-6 pb-24"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="w-full max-w-sm space-y-6">
        {/* Success icon + heading */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: '#F0F4E8', color: '#6B8E23' }}
          >
            &#10003;
          </div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)', fontFamily: 'serif' }}>
            Payment received
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Order #{shortId}
          </p>
        </div>

        {/* Enrichment card — shown once data loads, never blocks CTAs */}
        {summary && (
          <div
            className="rounded-[6px] border p-4 space-y-1"
            style={{ borderColor: 'var(--card)', backgroundColor: '#F5EFE9' }}
          >
            {summary.store_name && (
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {summary.store_name}
              </p>
            )}
            {summary.total_amount != null && (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Total: &#8377;{summary.total_amount}
              </p>
            )}
            {summary.source_order_id && (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Ref: {summary.source_order_id}
              </p>
            )}
          </div>
        )}

        {/* Secondary order chip (mixed cart) */}
        {secondaryOrderId && (
          <button
            onClick={() => navigate(`/orders?active=${secondaryOrderId}`)}
            className="w-full text-sm text-left px-4 py-2 rounded-[6px] border"
            style={{ borderColor: 'var(--card)', color: 'var(--text-secondary)', backgroundColor: 'var(--muted)' }}
          >
            Shop order #{secondaryOrderId.slice(0, 8).toUpperCase()} &rarr;
          </button>
        )}

        {/* CTAs */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/orders?active=${orderId}`)}
            className="w-full py-3 rounded-[6px] text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Track Order
          </button>
          <button
            onClick={() => navigate('/order')}
            className="w-full py-3 rounded-[6px] text-sm font-medium border"
            style={{ borderColor: 'var(--card)', color: 'var(--text)' }}
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  )
}
