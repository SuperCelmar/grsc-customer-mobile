/**
 * SubscriptionsScreen — Subs tab management hub
 *
 * Hook source: useSubscription() from ./useSubscription
 *   id, status, productName, productImage, frequency, nextShipAt,
 *   editByDeadline, hoursUntilNextShip, inEditWindow, savingsToDate
 *
 * Actions:  useSubscriptionActions() — skipNext / changeFrequency / cancel (Phase 3.5 stubs)
 * QA mock:  append ?subState=none|active|paused|expired|active-edit-window to URL
 */

import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { ScreenHeader } from '../../components/ScreenHeader'
import { ProductImage } from '../../components/ProductImage'
import { useSubscription, useSubscriptionActions } from './useSubscription'
import type { SubscriptionInterval } from '../../lib/api'

const CADENCE_OPTIONS: { interval: SubscriptionInterval; interval_count: number; label: string }[] = [
  { interval: 'week', interval_count: 2, label: 'Every 2 weeks (Biweekly)' },
  { interval: 'month', interval_count: 1, label: 'Once a month (Monthly)' },
]

function daysUntil(hours: number | null): number {
  if (hours == null) return 0
  return Math.max(0, Math.floor(hours / 24))
}

function formatDeadlineDay(date: Date): string {
  return date.toLocaleDateString('en-IN', { weekday: 'long' })
}

function formatShipDate(date: Date): string {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// ── Frequency picker bottom sheet ──────────────────────────────────────────────

type FreqSheetProps = {
  currentInterval: SubscriptionInterval
  currentCount: number
  subscriptionId: string
  onClose: () => void
}

function FrequencySheet({ currentInterval, currentCount, subscriptionId, onClose }: FreqSheetProps) {
  const actions = useSubscriptionActions()
  const [selected, setSelected] = useState({ interval: currentInterval, count: currentCount })
  const [loading, setLoading] = useState(false)

  const changed = selected.interval !== currentInterval || selected.count !== currentCount

  async function save() {
    if (!changed) { onClose(); return }
    setLoading(true)
    try {
      await actions.changeFrequency(subscriptionId, selected.interval, selected.count)
      toast.success('Delivery frequency updated.')
      onClose()
    } catch {
      toast.error('Could not update frequency. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl max-h-[60vh] flex flex-col">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-[#E8DDD0]">
          <h2 className="text-base font-semibold text-[var(--text)]">Change frequency</h2>
          <button onClick={onClose} disabled={loading} className="text-[var(--text-secondary)] text-xl p-1 disabled:opacity-40">×</button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-2">
          {CADENCE_OPTIONS.map(opt => (
            <label
              key={`${opt.interval}-${opt.interval_count}`}
              className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer"
              style={{
                borderColor: selected.interval === opt.interval && selected.count === opt.interval_count
                  ? 'var(--primary)' : '#E8DDD0',
                backgroundColor: selected.interval === opt.interval && selected.count === opt.interval_count
                  ? '#F5EFE9' : 'white',
              }}
            >
              <input
                type="radio"
                name="freq"
                checked={selected.interval === opt.interval && selected.count === opt.interval_count}
                onChange={() => setSelected({ interval: opt.interval, count: opt.interval_count })}
                className="accent-[var(--primary)]"
              />
              <span className="text-sm text-[var(--text)]">{opt.label}</span>
            </label>
          ))}
        </div>
        <div className="px-4 pb-6 pt-2">
          <button
            onClick={save}
            disabled={loading || !changed}
            className="w-full py-3 rounded-lg text-white text-sm font-semibold disabled:opacity-40"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Active hero card ───────────────────────────────────────────────────────────

type HeroCardProps = {
  productName: string | null
  productImage: string | null
  nextShipAt: Date | null
  hoursUntilNextShip: number | null
  inEditWindow: boolean
  editByDeadline: Date | null
  onSkip: () => void
  skipLoading: boolean
}

function HeroCard({
  productName, productImage, nextShipAt, hoursUntilNextShip,
  inEditWindow, editByDeadline, onSkip, skipLoading,
}: HeroCardProps) {
  const days = daysUntil(hoursUntilNextShip)

  return (
    <div className="rounded-lg border border-[#E8DDD0] p-4 space-y-3" style={{ backgroundColor: '#F5EFE9' }}>
      <div className="flex items-start gap-3">
        <ProductImage src={productImage} alt={productName ?? 'Bean'} size={56} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text)] leading-snug">{productName ?? '—'}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Ships in {days} day{days !== 1 ? 's' : ''}
            {nextShipAt && ` · ${formatShipDate(nextShipAt)}`}
          </p>
          {inEditWindow && editByDeadline && (
            <span
              className="inline-block mt-1.5 text-[11px] font-semibold text-white px-2 py-0.5 rounded"
              style={{ backgroundColor: '#D4A574' }}
            >
              Edit by {formatDeadlineDay(editByDeadline)} 11:59 PM
            </span>
          )}
        </div>
      </div>

      {/* Skip button — 1 tap from hero (AC-3) */}
      <button
        onClick={onSkip}
        disabled={skipLoading}
        className="w-full py-2 rounded-lg border text-sm font-medium disabled:opacity-50 active:scale-[0.99] transition-transform"
        style={{ borderColor: '#D4A574', color: '#D4A574' }}
      >
        {skipLoading ? 'Skipping…' : 'Skip next delivery'}
      </button>
    </div>
  )
}

// ── Main screen ────────────────────────────────────────────────────────────────

export function SubscriptionsScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sub = useSubscription()
  const actions = useSubscriptionActions()
  const [skipLoading, setSkipLoading] = useState(false)
  const [freqOpen, setFreqOpen] = useState(searchParams.get('openFrequency') === '1')

  async function handleSkip() {
    if (!sub) return
    setSkipLoading(true)
    try {
      await actions.skipNext(sub.id)
      const newDate = sub.nextShipAt
        ? new Date(sub.nextShipAt.getTime() + (sub.interval_count ?? 2) * 7 * 24 * 60 * 60 * 1000)
        : null
      const msg = newDate
        ? `Skipped — next delivery ${formatShipDate(newDate)}`
        : 'Next delivery skipped.'
      toast.success(msg)
    } catch {
      toast.error('Could not skip. Please try again.')
    } finally {
      setSkipLoading(false)
    }
  }

  const isActive = sub?.status === 'active'
  const isPaused = sub?.status === 'paused'
  const isExpired = sub?.status === 'expired'
  const hasActiveSub = isActive || isPaused || isExpired

  return (
    <div className="flex flex-col min-h-screen bg-white pb-24">
      <ScreenHeader title="Subscriptions" />

      <div className="px-4 py-4 space-y-4">

        {/* ── Empty state (no subscription) ── */}
        {!hasActiveSub && (
          <div
            className="rounded-lg border border-[#E8DDD0] p-4 text-center space-y-3"
            style={{ backgroundColor: '#F5EFE9' }}
          >
            <p className="text-sm font-medium text-[var(--text)]">Never run out of your favourite beans</p>
            <p className="text-xs text-[var(--text-secondary)]">
              Start a subscription from any bean's product page — save 10% on every recurring delivery.
            </p>
            <button
              onClick={() => navigate('/order?category=online-performance-coffee')}
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Browse Menu
            </button>
          </div>
        )}

        {/* ── Active subscription hero ── */}
        {isActive && sub && (
          <HeroCard
            productName={sub.productName}
            productImage={sub.productImage}
            nextShipAt={sub.nextShipAt}
            hoursUntilNextShip={sub.hoursUntilNextShip}
            inEditWindow={sub.inEditWindow}
            editByDeadline={sub.editByDeadline}
            onSkip={handleSkip}
            skipLoading={skipLoading}
          />
        )}

        {/* ── Paused state ── */}
        {isPaused && sub && (
          <div className="rounded-lg border border-[#E8DDD0] p-4" style={{ backgroundColor: '#F5EFE9' }}>
            <p className="text-sm font-semibold text-[var(--text)]">{sub.productName}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Subscription paused</p>
            {/* Resume deferred to v1.1 — see plan Step 1 */}
            <button
              disabled
              className="mt-3 w-full py-2 rounded-lg border text-sm font-medium opacity-40 cursor-not-allowed"
              style={{ borderColor: '#E8DDD0', color: 'var(--text-secondary)' }}
              title="Coming in v1.1"
            >
              Resume subscription
            </button>
          </div>
        )}

        {/* ── Expired / payment failed ── */}
        {isExpired && sub && (
          <div
            className="rounded-lg border p-4"
            style={{ backgroundColor: 'rgba(180,44,31,0.06)', borderColor: 'rgba(180,44,31,0.25)' }}
          >
            <p className="text-sm font-semibold" style={{ color: '#B42C1F' }}>Payment failed</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Your {sub.productName} subscription is paused.
            </p>
            <button
              onClick={() => navigate('/account')}
              className="mt-3 w-full py-2 rounded-lg text-white text-sm font-semibold"
              style={{ backgroundColor: '#B42C1F' }}
            >
              Update payment method
            </button>
          </div>
        )}

        {/* ── Action rows (active only) ── */}
        {isActive && sub && (
          <div className="rounded-lg border border-[#E8DDD0] divide-y divide-[#E8DDD0]">
            {/* Change frequency */}
            <button
              onClick={() => setFreqOpen(true)}
              className="w-full flex items-center justify-between px-4 py-4 active:bg-[#F5EFE9] transition-colors"
              style={{ minHeight: 56 }}
            >
              <div className="text-left">
                <span className="text-sm font-medium text-[var(--text)]">Change frequency</span>
                <span className="text-xs text-[var(--text-secondary)] ml-2">
                  {sub.frequency === 'biweekly' ? 'Every 2 weeks' : 'Monthly'}
                </span>
              </div>
              <ChevronRight size={18} className="text-[var(--text-secondary)]" />
            </button>

            {/* Pause — deferred to v1.1 — see plan Step 1 */}
            <button
              disabled
              className="w-full flex items-center justify-between px-4 py-4 opacity-40 cursor-not-allowed"
              style={{ minHeight: 56 }}
              title="Coming in v1.1"
            >
              <span className="text-sm font-medium text-[var(--text)]">Pause subscription</span>
              <span className="text-xs text-[var(--text-secondary)] bg-[#F5EFE9] px-2 py-0.5 rounded">Soon</span>
            </button>
          </div>
        )}

        {/* ── Cancel link (active only, 2-tap via interstitial — AC-5) ── */}
        {isActive && sub && (
          <div className="pt-2 text-center">
            <button
              onClick={() => navigate('/subscriptions/cancel')}
              className="text-sm font-medium"
              style={{ color: '#B42C1F' }}
            >
              Cancel subscription
            </button>
          </div>
        )}
      </div>

      {/* ── Frequency picker sheet ── */}
      {freqOpen && sub && (
        <FrequencySheet
          currentInterval={sub.interval ?? 'week'}
          currentCount={sub.interval_count ?? 2}
          subscriptionId={sub.id}
          onClose={() => setFreqOpen(false)}
        />
      )}
    </div>
  )
}
