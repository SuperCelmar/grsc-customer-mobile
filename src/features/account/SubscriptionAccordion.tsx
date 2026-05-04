import { useState } from 'react'
import { Coffee } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Accordion, AccordionRow } from './Accordion'
import { useSubscriptionActions } from '../subscriptions/useSubscription'
import type { CustomerSubscriptions } from '../../lib/api'

type Sub = CustomerSubscriptions['subscriptions'][0]

type Props = {
  subscription: Sub | null
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function StatusPill({ status }: { status: Sub['status'] }) {
  if (status === 'active') {
    return (
      <span className="text-xs font-semibold bg-[#F0F4E8] text-[#6B8E23] px-2 py-0.5 rounded-full">
        Active
      </span>
    )
  }
  if (status === 'paused') {
    return (
      <span className="text-xs font-semibold bg-[#F5EFE9] text-[#6B6560] px-2 py-0.5 rounded-full">
        Paused
      </span>
    )
  }
  return (
    <span className="text-xs font-semibold bg-[#F5EFE9] text-[#6B6560] px-2 py-0.5 rounded-full">
      —
    </span>
  )
}

function CollapsedSummary({ subscription }: { subscription: Sub | null }) {
  if (!subscription) {
    return <span className="text-sm text-[#6B6560]">No active subscription</span>
  }
  const price = Math.round(subscription.price_snapshot / 100)
  return (
    <span className="text-sm text-[#6B6560]">
      Next shipment · {formatDate(subscription.next_shipment_at)} · ₹{price}
    </span>
  )
}

function ActiveContent({ subscription }: { subscription: Sub }) {
  const navigate = useNavigate()
  const actions = useSubscriptionActions()
  const [skipLoading, setSkipLoading] = useState(false)

  const price = Math.round(subscription.price_snapshot / 100)

  async function handleSkip() {
    setSkipLoading(true)
    try {
      await actions.skipNext(subscription.id)
      toast.success('Skipped — next delivery rescheduled.')
    } catch {
      toast.error('Could not skip. Please try again.')
    } finally {
      setSkipLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {subscription.image_url ? (
          <img
            src={subscription.image_url}
            alt={subscription.product_name}
            className="w-12 h-12 rounded-md object-cover shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-md bg-[#F5EFE9] flex items-center justify-center shrink-0">
            <Coffee className="w-5 h-5 text-[#D4A574]" />
          </div>
        )}
        <div>
          <p className="font-semibold text-[#1A1410] text-sm">{subscription.product_name}</p>
          {subscription.variant_name && (
            <p className="text-xs text-[#6B6560]">{subscription.variant_name}</p>
          )}
        </div>
      </div>

      <div className="space-y-0">
        <AccordionRow>
          <span className="text-sm text-[#6B6560]">Interval</span>
          <span className="text-sm font-medium text-[#1A1410]">
            Every {subscription.interval_count} {subscription.interval}(s)
          </span>
        </AccordionRow>
        <AccordionRow>
          <span className="text-sm text-[#6B6560]">Next shipment</span>
          <span className="text-sm font-medium text-[#1A1410]">
            {formatDate(subscription.next_shipment_at)}
          </span>
        </AccordionRow>
        <AccordionRow>
          <span className="text-sm text-[#6B6560]">Last charged</span>
          <span className="text-sm font-medium text-[#1A1410]">
            {subscription.last_charged_at ? formatDate(subscription.last_charged_at) : '—'}
          </span>
        </AccordionRow>
        <AccordionRow>
          <span className="text-sm text-[#6B6560]">Price</span>
          <span className="text-sm font-extrabold text-[#D4A574]">₹{price}</span>
        </AccordionRow>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleSkip}
          disabled={skipLoading}
          className="flex-1 py-2 text-sm font-semibold border border-[#D4A574] text-[#D4A574] rounded-md disabled:opacity-50"
        >
          {skipLoading ? 'Skipping…' : 'Skip next'}
        </button>
        <button
          type="button"
          disabled
          title="Coming in v1.1"
          className="flex-1 py-2 text-sm font-semibold border border-[#E8DDD0] text-[#6B6560] rounded-md opacity-50 cursor-not-allowed"
        >
          Pause
        </button>
      </div>

      <button
        type="button"
        onClick={() => navigate('/subscriptions')}
        className="w-full text-center text-xs font-medium pt-0.5"
        style={{ color: '#D4A574' }}
      >
        Manage full subscription →
      </button>
    </div>
  )
}

function EmptyContent() {
  const navigate = useNavigate()
  return (
    <div className="py-2 text-center">
      <p className="text-sm text-[#6B6560] mb-3">
        Subscribe &amp; save 10% on every delivery. Start from any bean&apos;s product page.
      </p>
      <button
        type="button"
        onClick={() => navigate('/order?category=online-performance-coffee')}
        className="w-full py-2.5 text-sm font-semibold bg-[#D4A574] text-white rounded-md"
      >
        Browse subscribable beans →
      </button>
    </div>
  )
}

export function SubscriptionAccordion({ subscription }: Props) {
  const navigate = useNavigate()
  const rightSlot = subscription ? <StatusPill status={subscription.status} /> : null

  const savingsSnippet = subscription ? (
    <div className="flex items-center gap-1.5 mt-0.5">
      <span className="text-xs text-[#6B6560]">10% off every delivery</span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); navigate('/subscriptions') }}
        className="text-xs font-medium leading-none"
        style={{ color: '#D4A574' }}
        aria-label="Go to subscription management"
      >
        →
      </button>
    </div>
  ) : null

  return (
    <Accordion
      icon={Coffee}
      title="Performance Coffee Subscription"
      rightSlot={rightSlot}
      defaultOpen={subscription !== null}
      collapsedSummary={
        <div className="flex flex-col gap-0">
          <CollapsedSummary subscription={subscription} />
          {savingsSnippet}
        </div>
      }
    >
      {subscription ? (
        <ActiveContent subscription={subscription} />
      ) : (
        <EmptyContent />
      )}
    </Accordion>
  )
}
