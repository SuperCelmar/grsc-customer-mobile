import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useCustomerOrders } from '../../hooks/useCustomerProfile'
import { ActiveOrderTracker } from './ActiveOrderTracker'
import { OrderDetailSheet } from './OrderDetailSheet'
import type { CustomerOrders } from '../../lib/api'

type Order = CustomerOrders['orders'][number]

const STATUS_LABELS: Record<string, string> = {
  pending: 'Placed',
  accepted: 'Accepted',
  preparing: 'Preparing',
  food_ready: 'Ready',
  dispatched: 'On the Way',
  delivered: 'Delivered',
  completed: 'Done',
  cancelled: 'Cancelled',
}

const ACTIVE_STATUSES = new Set(['pending', 'accepted', 'preparing', 'food_ready', 'dispatched'])

function StatusBadge({ status }: { status: string }) {
  const isActive = ACTIVE_STATUSES.has(status)
  const isCancelled = status === 'cancelled'
  const isDone = ['delivered', 'completed'].includes(status)

  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{
        backgroundColor: isCancelled ? '#FEE2E2' : isDone ? '#F0F4E8' : 'var(--muted)',
        color: isCancelled ? '#B42C1F' : isDone ? '#6B8E23' : 'var(--primary)',
      }}
    >
      {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />}
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export function OrderHistoryScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeOrderId = searchParams.get('active')

  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const { data, isLoading, error } = useCustomerOrders(page)

  const orders = data?.orders || []
  const activeOrders = orders.filter(o => ACTIVE_STATUSES.has(o.status))
  const pastOrders = orders.filter(o => !ACTIVE_STATUSES.has(o.status))

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--card)] flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-[var(--text-secondary)]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-[var(--text)]">My Orders</h1>
      </div>

      <div className="flex-1 px-4 py-4 space-y-5">
        {/* Active order from navigation (just placed) */}
        {activeOrderId && (
          <div>
            <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Active</h2>
            <ActiveOrderTracker orderId={activeOrderId} />
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        )}

        {error && (
          <p className="text-sm text-[var(--text-secondary)] text-center py-4">Failed to load orders.</p>
        )}

        {!isLoading && !error && orders.length === 0 && !activeOrderId && (
          <div className="text-center py-12">
            <p className="text-[var(--text-secondary)] text-sm mb-3">No orders yet.</p>
            <button
              onClick={() => navigate('/order')}
              className="text-sm font-medium"
              style={{ color: 'var(--primary)' }}
            >Browse the menu →</button>
          </div>
        )}

        {/* Active orders from history (if not already shown via URL param) */}
        {!activeOrderId && activeOrders.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Active</h2>
            <div className="space-y-2">
              {activeOrders.map(order => (
                <div
                  key={order.id}
                  className="border border-[var(--card)] rounded-xl p-3 cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">
                        {order.source_order_id || 'Order'}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {order.item_count} {order.item_count === 1 ? 'item' : 'items'} · ₹{order.total_amount}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <ActiveOrderTracker orderId={order.id} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past orders */}
        {pastOrders.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Past Orders</h2>
            <div className="space-y-2">
              {pastOrders.map(order => {
                const date = new Date(order.order_date).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short',
                })
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="w-full text-left border border-[var(--card)] rounded-xl p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--text)]">{date} · ₹{order.total_amount}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
                          {order.cashback_earned > 0 && (
                            <span style={{ color: '#6B8E23' }}> · +₹{order.cashback_earned} cashback</span>
                          )}
                        </p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  </button>
                )
              })}
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
