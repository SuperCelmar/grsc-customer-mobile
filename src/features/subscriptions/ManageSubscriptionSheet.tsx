import { useState } from 'react'
import type { SubscriptionStatus, SubscriptionInterval } from '../../lib/api'

type Props = {
  id: string
  productName: string
  status: SubscriptionStatus
  interval: SubscriptionInterval
  interval_count: number
  onClose: () => void
  onMutated: () => void
}

const CADENCE_OPTIONS: { interval: SubscriptionInterval; interval_count: number; label: string }[] = [
  { interval: 'week', interval_count: 2, label: 'Every 2 weeks' },
  { interval: 'month', interval_count: 1, label: 'Monthly' },
]

function stub(action: string): Promise<void> {
  return new Promise(resolve => setTimeout(() => { console.log(`[stub] subscription ${action}`); resolve() }, 300))
}

export function ManageSubscriptionSheet({ id, productName, status, interval, interval_count, onClose, onMutated }: Props) {
  const [loading, setLoading] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [selectedInterval, setSelectedInterval] = useState(interval)
  const [selectedCount, setSelectedCount] = useState(interval_count)
  const cadenceChanged = selectedInterval !== interval || selectedCount !== interval_count

  async function act(action: () => Promise<void>) {
    setLoading(true)
    try {
      await action()
      onMutated()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl max-h-[80vh] flex flex-col">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-[var(--card)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">Manage Subscription</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{productName}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-[var(--text-secondary)] text-xl p-1 disabled:opacity-40"
          >×</button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Delivery Cadence</p>
            <div className="space-y-2">
              {CADENCE_OPTIONS.map(opt => (
                <label
                  key={`${opt.interval}-${opt.interval_count}`}
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer"
                  style={{
                    borderColor: selectedInterval === opt.interval && selectedCount === opt.interval_count
                      ? 'var(--primary)' : 'var(--card)',
                    backgroundColor: selectedInterval === opt.interval && selectedCount === opt.interval_count
                      ? 'var(--muted)' : 'white',
                  }}
                >
                  <input
                    type="radio"
                    name="cadence"
                    checked={selectedInterval === opt.interval && selectedCount === opt.interval_count}
                    onChange={() => { setSelectedInterval(opt.interval); setSelectedCount(opt.interval_count) }}
                    className="accent-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--text)]">{opt.label}</span>
                </label>
              ))}
            </div>
            {cadenceChanged && (
              <button
                onClick={() => act(() => stub(`${id}/cadence`))}
                disabled={loading}
                className="mt-3 w-full py-2.5 rounded-lg border text-sm font-semibold disabled:opacity-50"
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                {loading ? 'Saving…' : 'Save cadence change'}
              </button>
            )}
          </div>

          <div className="border-t border-[var(--card)] pt-4 space-y-2">
            {status === 'active' && (
              <button
                onClick={() => act(() => stub(`${id}/pause`))}
                disabled={loading}
                className="w-full py-2.5 rounded-lg border text-sm font-medium disabled:opacity-50"
                style={{ borderColor: 'var(--card)', color: 'var(--text)' }}
              >
                Pause subscription
              </button>
            )}
            {status === 'paused' && (
              <button
                onClick={() => act(() => stub(`${id}/resume`))}
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                Resume subscription
              </button>
            )}
            <button
              onClick={() => act(() => stub(`${id}/skip-next`))}
              disabled={loading}
              className="w-full py-2.5 rounded-lg border text-sm font-medium disabled:opacity-50"
              style={{ borderColor: 'var(--card)', color: 'var(--text)' }}
            >
              Skip next shipment
            </button>
          </div>

          <div className="border-t border-[var(--card)] pt-4">
            {confirmCancel ? (
              <div className="space-y-2">
                <p className="text-sm text-[var(--text)]">Cancel this subscription? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmCancel(false)}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-lg border text-sm font-medium"
                    style={{ borderColor: 'var(--card)', color: 'var(--text)' }}
                  >
                    Keep it
                  </button>
                  <button
                    onClick={() => act(() => stub(`${id}/cancel`))}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: '#B42C1F' }}
                  >
                    {loading ? 'Cancelling…' : 'Yes, cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmCancel(true)}
                className="text-xs font-medium"
                style={{ color: '#B42C1F' }}
              >
                Cancel subscription
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
