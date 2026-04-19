import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Package, Utensils, Truck } from 'lucide-react'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useCustomerOrders } from '../../hooks/useCustomerProfile'
import { ActiveOrderTracker } from './ActiveOrderTracker'
import { OrderDetailSheet } from './OrderDetailSheet'
import { QuickReorderRow } from '../reorder/QuickReorderRow'
import { useReorder } from './useReorder'
import type { CustomerOrders } from '../../lib/api'

type Order = CustomerOrders['orders'][number]

const STATUS_LABELS: Record<string, string> = {
  pending: 'Placed',
  placed: 'Placed',
  active: 'Active',
  accepted: 'Accepted',
  preparing: 'Preparing',
  food_ready: 'Ready',
  ready: 'Ready',
  dispatched: 'On the Way',
  out_for_delivery: 'On the Way',
  delivered: 'Delivered',
  completed: 'Done',
  done: 'Done',
  cancelled: 'Cancelled',
}

const ACTIVE_STATUSES = new Set([
  'placed', 'accepted', 'preparing', 'food_ready', 'ready', 'dispatched', 'out_for_delivery', 'active',
])

const DONE_STATUSES = new Set(['delivered', 'completed', 'done'])

function normalizeStatus(status: string): string {
  return status.toLowerCase().replace(/\s+/g, '_')
}

function activeStatusSubline(status: string): string | null {
  const s = normalizeStatus(status)
  if (s === 'preparing') return 'Your coffee is being crafted'
  if (s === 'ready' || s === 'food_ready') return 'Ready for pickup'
  if (s === 'out_for_delivery' || s === 'dispatched') return 'On the way'
  return null
}

function StatusBadge({ status }: { status: string }) {
  const s = normalizeStatus(status)
  const isActive = ACTIVE_STATUSES.has(s)
  const isCancelled = s === 'cancelled'
  const isDone = DONE_STATUSES.has(s)

  let bg: string
  let color: string
  if (isCancelled) {
    bg = 'rgba(180,44,31,0.1)'
    color = '#B42C1F'
  } else if (isDone) {
    bg = 'rgba(107,142,35,0.1)'
    color = '#6B8E23'
  } else {
    bg = 'rgba(212,165,116,0.15)'
    color = '#A0826D'
  }

  return (
    <span
      className="text-[11px] px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: bg, color }}
    >
      {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />}
      {STATUS_LABELS[s] || status}
    </span>
  )
}

const ORDER_TYPE_ICONS: Record<string, React.ReactElement> = {
  takeaway: <Package size={14} />,
  'dine-in': <Utensils size={14} />,
  'dine in': <Utensils size={14} />,
  dinein: <Utensils size={14} />,
  delivery: <Truck size={14} />,
}

function OrderTypeBadge({ type }: { type: string }) {
  const icon = ORDER_TYPE_ICONS[type.toLowerCase()] ?? <Package size={14} />
  return (
    <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: '#1A1410' }}>
      {icon}
      {type}
    </span>
  )
}

function PastOrderCard({ order, onOpen }: { order: Order; onOpen: () => void }) {
  const { reorder, canReorder } = useReorder()
  const date = new Date(order.order_date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
  })
  const previewItems = order.items.slice(0, 2)

  return (
    <button
      onClick={onOpen}
      className="w-full text-left border border-[#E8DDD0] rounded-[6px] bg-white p-3"
    >
      <div className="flex items-start gap-3">
        <div className="flex gap-1 flex-shrink-0">
          {previewItems.map(item => (
            <div
              key={item.id}
              className="w-8 h-8 rounded-[4px] bg-[#F5EFE9] flex items-center justify-center text-[#6B6560] text-xs font-medium"
            >
              {item.name.charAt(0)}
            </div>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1A1410]">{date} · ₹{order.total_amount}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <OrderTypeBadge type={order.order_type} />
            <StatusBadge status={order.status} />
          </div>
          {order.cashback_earned > 0 && (
            <p className="text-[11px] mt-1" style={{ color: '#A0826D' }}>+₹{order.cashback_earned} cashback</p>
          )}
        </div>

        {canReorder && (
          <button
            onClick={e => { e.stopPropagation(); reorder() }}
            className="flex-shrink-0 h-[26px] px-3 rounded-full text-xs font-medium text-[#1A1410] shadow-sm"
            style={{ backgroundColor: '#D4A574' }}
          >
            Reorder
          </button>
        )}
      </div>
    </button>
  )
}

export function OrderHistoryScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const { data, isLoading, error } = useCustomerOrders(page)

  const orders = data?.orders || []
  const activeOrders = orders.filter(o => ACTIVE_STATUSES.has(normalizeStatus(o.status)))
  const pastOrders = orders.filter(o => !ACTIVE_STATUSES.has(normalizeStatus(o.status)))

  const activeParam = searchParams.get('active')
  const activeOrderIds = activeParam
    ? activeParam.split(',').map(id => id.trim()).filter(Boolean)
    : []

  const hasActiveSection = activeOrderIds.length > 0 || activeOrders.length > 0
  const cashbackBalance = orders
    .filter(o => DONE_STATUSES.has(normalizeStatus(o.status)))
    .reduce((sum, o) => sum + (o.cashback_earned || 0), 0)

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <ScreenHeader title="My Orders" />

      {/* Cashback balance strip */}
      {cashbackBalance > 0 && (
        <div
          className="mx-4 mt-3 px-3 py-2 rounded-[6px] border flex items-center justify-between"
          style={{ backgroundColor: '#FDF8F3', borderColor: '#D4A574' }}
        >
          <div className="flex items-baseline gap-1.5">
            <span className="text-[12px]" style={{ color: '#6B6560' }}>Cashback balance</span>
            <span className="text-[15px] font-bold" style={{ color: '#1A1410' }}>₹{cashbackBalance}</span>
          </div>
          <button
            onClick={() => navigate('/account')}
            className="text-[13px] font-medium"
            style={{ color: '#D4A574' }}
          >
            Redeem →
          </button>
        </div>
      )}

      <div className="flex-1 px-4 py-4 space-y-5">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        )}

        {error && (
          <p className="text-sm text-[var(--text-secondary)] text-center py-4">Failed to load orders.</p>
        )}

        {!isLoading && !error && orders.length === 0 && activeOrderIds.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[var(--text-secondary)] text-sm mb-3">No orders yet.</p>
            <button
              onClick={() => navigate('/order')}
              className="text-sm font-medium"
              style={{ color: 'var(--primary)' }}
            >Browse the menu →</button>
          </div>
        )}

        {/* Active Orders section */}
        {hasActiveSection && (
          <div>
            <h2
              className="text-[17px] font-bold text-[#1A1410] mb-3"
              style={{ fontFamily: 'serif' }}
            >
              Active Order
            </h2>
            <div className="space-y-3">
              {/* From navigation params (just placed) */}
              {activeOrderIds.map(id => (
                <div key={id} className="border border-[#E8DDD0] rounded-[6px] bg-white overflow-hidden">
                  <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                    <span className="w-2 h-2 rounded-full bg-[#D4A574] animate-pulse flex-shrink-0" />
                    <span className="text-xs text-[#6B6560]">Active</span>
                  </div>
                  <div className="px-3 pb-3">
                    <ActiveOrderTracker orderId={id} />
                  </div>
                </div>
              ))}
              {/* From history */}
              {activeOrderIds.length === 0 && activeOrders.map(order => {
                const subline = activeStatusSubline(order.status)
                return (
                  <div
                    key={order.id}
                    className="border border-[#E8DDD0] rounded-[6px] bg-white overflow-hidden cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                      <span className="w-2 h-2 rounded-full bg-[#D4A574] animate-pulse flex-shrink-0" />
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="px-3 pb-1">
                      <p className="text-sm font-medium text-[var(--text)]">
                        {order.source_order_id || 'Order'}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {order.item_count} {order.item_count === 1 ? 'item' : 'items'} · ₹{order.total_amount}
                      </p>
                      {subline && (
                        <p className="text-[13px] text-[#6B6560] mt-1">{subline}</p>
                      )}
                    </div>
                    <div className="px-3 pb-3">
                      <ActiveOrderTracker orderId={order.id} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Reorder */}
        <QuickReorderRow />

        {/* Past Orders section — "Order History" single serif header, no "PAST" label */}
        {pastOrders.length > 0 && (
          <div>
            <h2
              className="text-[17px] font-bold text-[#1A1410] mb-3"
              style={{ fontFamily: 'serif' }}
            >
              Order History
            </h2>
            <div className="space-y-2">
              {pastOrders.map(order => (
                <PastOrderCard
                  key={order.id}
                  order={order}
                  onOpen={() => setSelectedOrder(order)}
                />
              ))}
            </div>

            {data?.hasMore && (
              <button
                onClick={() => setPage(p => p + 1)}
                className="w-full mt-3 py-2 border border-[var(--card)] rounded-lg text-sm text-[var(--text-secondary)]"
              >
                Load More
              </button>
            )}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailSheet
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  )
}
