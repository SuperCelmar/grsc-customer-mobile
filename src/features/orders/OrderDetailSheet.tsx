import type { CustomerOrders } from '../../lib/api'

type Order = CustomerOrders['orders'][number]

type Props = {
  order: Order
  onClose: () => void
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  accepted: 'Accepted',
  preparing: 'Being Prepared',
  food_ready: 'Ready for Pickup',
  dispatched: 'On the Way',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function OrderDetailSheet({ order, onClose }: Props) {
  const statusLabel = STATUS_LABELS[order.status] || order.status
  const isCancelled = order.status === 'cancelled'
  const isCompleted = ['delivered', 'completed'].includes(order.status)

  const date = new Date(order.order_date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-4 pt-4 pb-3 flex items-start justify-between border-b border-[var(--card)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">
              {order.source_order_id || `Order`}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{date} · {order.store_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: isCancelled ? '#FEE2E2' : isCompleted ? '#F0F4E8' : 'var(--muted)',
                color: isCancelled ? '#B42C1F' : isCompleted ? '#6B8E23' : 'var(--primary)',
              }}
            >{statusLabel}</span>
            <button onClick={onClose} className="text-[var(--text-secondary)] text-xl p-1">×</button>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Items */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Items</h3>
            <div className="space-y-2">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <span className="text-[var(--text)]">{item.name} × {item.quantity}</span>
                    {item.addons.length > 0 && (
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {item.addons.map(a => a.addon_name).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="text-[var(--text)] ml-3">₹{(item.unit_price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-[var(--card)] pt-3 space-y-1 text-sm">
            {order.loyalty_discount_amount > 0 && (
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Loyalty Discount</span>
                <span style={{ color: '#6B8E23' }}>-₹{order.loyalty_discount_amount}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-[var(--text)]">
              <span>Total</span>
              <span>₹{order.total_amount}</span>
            </div>
            {order.cashback_earned > 0 && (
              <div className="flex justify-between text-xs" style={{ color: '#6B8E23' }}>
                <span>Cashback Earned</span>
                <span>+₹{order.cashback_earned}</span>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="flex justify-between text-sm text-[var(--text-secondary)]">
            <span>Payment</span>
            <span className="capitalize">{order.payment_status}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
