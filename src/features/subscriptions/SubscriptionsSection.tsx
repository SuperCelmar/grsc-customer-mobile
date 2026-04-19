import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubscriptions } from './useSubscriptions'
import { SubscriptionCard } from './SubscriptionCard'
import { ManageSubscriptionSheet } from './ManageSubscriptionSheet'

export function SubscriptionsSection() {
  const navigate = useNavigate()
  const { data, isLoading, refetch } = useSubscriptions()
  const [managingId, setManagingId] = useState<string | null>(null)

  const subscriptions = data?.subscriptions ?? []
  const managing = managingId ? subscriptions.find(s => s.id === managingId) ?? null : null

  if (isLoading) {
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-[var(--text)] uppercase tracking-wide">Scheduled Orders</h2>
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--primary)] border-t-transparent" />
        </div>
      </section>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-[var(--text)] uppercase tracking-wide">Scheduled Orders</h2>
        <div
          className="rounded-lg border border-[var(--card)] p-4 text-center space-y-3"
          style={{ backgroundColor: 'var(--muted)' }}
        >
          <p className="text-sm font-medium text-[var(--text)]">Never run out of your favourite beans</p>
          <p className="text-xs text-[var(--text-secondary)]">Subscribe to Performance Coffee and get it delivered on your schedule.</p>
          <button
            onClick={() => navigate('/order?subscribe=1')}
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Browse beans
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-[var(--text)] uppercase tracking-wide">Scheduled Orders</h2>
      <div className="space-y-2">
        {subscriptions.map(sub => (
          <SubscriptionCard
            key={sub.id}
            id={sub.id}
            productName={sub.product_name}
            variantName={sub.variant_name}
            imageUrl={sub.image_url}
            interval={sub.interval}
            interval_count={sub.interval_count}
            nextShipmentAt={sub.next_shipment_at}
            status={sub.status}
            priceSnapshot={sub.price_snapshot}
            onManage={() => setManagingId(sub.id)}
          />
        ))}
      </div>

      {managing && (
        <ManageSubscriptionSheet
          id={managing.id}
          productName={managing.product_name}
          status={managing.status}
          interval={managing.interval}
          interval_count={managing.interval_count}
          onClose={() => setManagingId(null)}
          onMutated={() => { refetch(); setManagingId(null) }}
        />
      )}
    </section>
  )
}
