import type { SubscriptionStatus, SubscriptionInterval } from '../../lib/api'

type Props = {
  id: string
  productName: string
  variantName: string | null
  imageUrl: string | null
  interval: SubscriptionInterval
  interval_count: number
  nextShipmentAt: string
  status: SubscriptionStatus
  priceSnapshot: number
  onManage: () => void
}

function statusChip(status: SubscriptionStatus) {
  const map: Record<SubscriptionStatus, { label: string; bg: string; color: string }> = {
    active: { label: 'Active', bg: '#F0F4E8', color: '#6B8E23' },
    paused: { label: 'Paused', bg: 'var(--muted)', color: 'var(--text-secondary)' },
    past_due: { label: 'Past Due', bg: '#FEF2F2', color: '#B42C1F' },
    cancelled: { label: 'Cancelled', bg: '#F5F5F5', color: '#6B6560' },
    cancelled_payment_failed: { label: 'Payment Failed', bg: '#FEF2F2', color: '#B42C1F' },
  }
  const s = map[status]
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

function cadenceText(interval: SubscriptionInterval, count: number): string {
  if (interval === 'month' && count === 1) return 'Monthly'
  if (interval === 'week' && count === 2) return 'Every 2 weeks'
  if (interval === 'week' && count === 1) return 'Weekly'
  return `Every ${count} ${interval}${count > 1 ? 's' : ''}`
}

function GRMonogram() {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center"
      style={{
        width: 56, height: 56, borderRadius: 6,
        backgroundColor: 'var(--muted)', fontFamily: 'serif',
        color: 'var(--primary)', fontSize: 22, fontWeight: 600, letterSpacing: 1,
      }}
    >
      GR
    </div>
  )
}

export function SubscriptionCard({
  productName, variantName, imageUrl,
  interval, interval_count, nextShipmentAt, status, priceSnapshot, onManage,
}: Props) {
  const nextDate = new Date(nextShipmentAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="bg-white rounded-lg border border-[var(--card)] p-3">
      <div className="flex items-start gap-3">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={productName}
            loading="lazy"
            className="flex-shrink-0 object-cover"
            style={{ width: 56, height: 56, borderRadius: 6 }}
          />
        ) : (
          <GRMonogram />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text)] leading-snug">{productName}</p>
              {variantName && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{variantName}</p>
              )}
            </div>
            {statusChip(status)}
          </div>

          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--text-secondary)]">
            <span>↻ {cadenceText(interval, interval_count)}</span>
            <span>Next: {nextDate}</span>
            <span>₹{(priceSnapshot / 100).toFixed(0)}/shipment</span>
          </div>
        </div>
      </div>

      {status !== 'cancelled' && status !== 'cancelled_payment_failed' && (
        <div className="mt-3 pt-3 border-t border-[var(--card)]">
          <button
            onClick={onManage}
            className="text-xs font-semibold"
            style={{ color: 'var(--primary)' }}
          >
            Manage
          </button>
        </div>
      )}
    </div>
  )
}
