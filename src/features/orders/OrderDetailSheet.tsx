import { useNavigate } from 'react-router-dom'
import { useReorder } from './useReorder'
import OrderItemCard from './OrderItemCard'
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

const ACTIVE_STATUSES = new Set([
  'placed', 'accepted', 'preparing', 'food_ready', 'ready', 'dispatched', 'out_for_delivery',
])

type FooterCTAs =
  | { type: 'active'; storePhone: string | null }
  | { type: 'completed' }
  | { type: 'cancelled' }

function getFooterCTAs(status: string, storePhone?: string | null): FooterCTAs {
  if (ACTIVE_STATUSES.has(status)) return { type: 'active', storePhone: storePhone ?? null }
  if (status === 'cancelled') return { type: 'cancelled' }
  return { type: 'completed' }
}

export function OrderDetailSheet({ order, onClose }: Props) {
  const navigate = useNavigate()
  const { reorder, canReorder } = useReorder(order)

  const handleTrackOrder = () => {
    onClose()
    navigate('/dashboard')
  }

  const handleViewReceipt = () => {
    window.print()
  }

  const statusLabel = STATUS_LABELS[order.status] || order.status
  const isCancelled = order.status === 'cancelled'
  const isCompleted = ['delivered', 'completed'].includes(order.status)

  const date = new Date(order.order_date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  const handleReorder = () => {
    reorder()
    onClose()
  }

  const footerCTAs = getFooterCTAs(order.status)

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white px-4 pt-4 pb-3 border-b border-[#E8DDD0] rounded-t-2xl z-10">
          <div className="pr-16">
            <p className="text-[11px] text-[#6B6560] uppercase tracking-wide">Pickup from</p>
            <h2 className="text-[20px] font-bold text-[#1A1410] leading-tight" style={{ fontFamily: 'serif' }}>
              {order.store_name}
            </h2>
            <p className="text-[12px] text-[#6B6560] mt-0.5">
              #{order.source_order_id} · {date} · {order.order_type}
            </p>
          </div>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: isCancelled ? '#FEE2E2' : isCompleted ? '#F0F4E8' : 'rgba(212,165,116,0.15)',
                color: isCancelled ? '#B42C1F' : isCompleted ? '#6B8E23' : '#A0826D',
              }}
            >{statusLabel}</span>
            <button onClick={onClose} className="text-[#6B6560] text-xl p-1 leading-none">×</button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4 pb-40">
          {/* Items */}
          <div>
            <h3 className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide mb-2">Items</h3>
            <div className="space-y-2">
              {order.items.map(item => (
                <OrderItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-[#E8DDD0] pt-3 space-y-1.5">
            {order.loyalty_discount_amount > 0 && (
              <div className="flex justify-between text-sm text-[#6B6560]">
                <span>Loyalty Discount</span>
                <span style={{ color: '#6B8E23' }}>-₹{order.loyalty_discount_amount}</span>
              </div>
            )}
            <div className="flex justify-between text-[17px] font-bold text-[#1A1410]">
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
          <div className="flex justify-between text-sm text-[#6B6560]">
            <span>Payment</span>
            <span className="capitalize">{order.payment_status}</span>
          </div>
        </div>

        {/* Sticky footer CTA */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-white px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)]"
          style={{ boxShadow: '0 -4px 12px rgba(0,0,0,0.05)' }}
        >
          {footerCTAs.type === 'active' && (
            <div className="flex flex-col gap-2">
              <button
                onClick={footerCTAs.storePhone ? () => { window.location.href = `tel:${footerCTAs.storePhone}` } : undefined}
                disabled={!footerCTAs.storePhone}
                className="w-full py-2.5 rounded-[6px] text-sm font-medium text-[#D4A574] bg-white border border-[#D4A574] disabled:opacity-40 active:scale-[0.98] transition-transform"
              >
                Contact store
              </button>
              <button
                onClick={handleTrackOrder}
                className="w-full h-12 rounded-[6px] text-[15px] font-semibold text-[#1A1410] shadow-sm active:scale-[0.98] transition-transform"
                style={{ backgroundColor: '#D4A574' }}
              >
                Track order
              </button>
            </div>
          )}

          {footerCTAs.type === 'completed' && (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleViewReceipt}
                className="w-full py-2.5 rounded-[6px] text-sm font-medium text-[#D4A574] bg-white border border-[#D4A574] active:scale-[0.98] transition-transform"
              >
                View receipt
              </button>
              <button
                onClick={handleReorder}
                disabled={!canReorder}
                className="w-full h-12 rounded-[6px] text-[15px] font-semibold text-[#1A1410] shadow-sm disabled:bg-[#E8DDD0] disabled:text-[#6B6560] disabled:shadow-none active:scale-[0.98] transition-transform"
                style={{ backgroundColor: canReorder ? '#D4A574' : undefined }}
              >
                {canReorder ? 'Reorder' : 'Reorder unavailable'}
              </button>
            </div>
          )}

          {footerCTAs.type === 'cancelled' && (
            <button
              onClick={handleReorder}
              disabled={!canReorder}
              className="w-full h-12 rounded-[6px] text-[15px] font-semibold text-[#1A1410] shadow-sm disabled:bg-[#E8DDD0] disabled:text-[#6B6560] active:scale-[0.98] transition-transform"
              style={{ backgroundColor: canReorder ? '#D4A574' : undefined }}
            >
              Reorder
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
