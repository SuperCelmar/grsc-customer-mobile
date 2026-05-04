import { useNavigate } from 'react-router-dom'
import { useSubscription, useSubscriptionActions } from '../subscriptions/useSubscription'

function daysUntil(date: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
}

function editDayLabel(deadline: Date): string {
  return deadline.toLocaleDateString('en-IN', { weekday: 'long' })
}

export function SubscriptionStateBlock() {
  const sub = useSubscription()
  const actions = useSubscriptionActions()
  const navigate = useNavigate()

  // No subscription — acquisition cross-sell
  if (!sub || sub.status === 'cancelled') {
    return (
      <div
        className="mx-4 rounded-md border border-[#E8DDD0] p-4"
        style={{ background: 'linear-gradient(135deg, #F5EFE9 0%, #E8DDD0 100%)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: '#D4A574' }}
          >
            NEW
          </span>
        </div>
        <p className="font-display font-semibold text-[#1A1410] text-[17px] leading-tight mb-1">
          Subscribe &amp; save 10%
        </p>
        <p className="text-[13px] text-[#6B6560] mb-3">
          On every recurring delivery. Skip, edit, or cancel anytime.
        </p>
        <button
          onClick={() => navigate('/order?category=online-performance-coffee')}
          className="w-full py-2.5 rounded-md text-sm font-semibold text-white"
          style={{ backgroundColor: '#D4A574' }}
        >
          Browse subscribable beans
        </button>
      </div>
    )
  }

  // Expired payment — alert banner
  if (sub.status === 'expired') {
    return (
      <div
        className="mx-4 rounded-md border p-4"
        style={{ backgroundColor: 'rgba(180,44,31,0.08)', borderColor: 'rgba(180,44,31,0.3)' }}
      >
        <p className="font-display font-semibold text-[#1A1410] text-[15px] leading-snug mb-1">
          Your subscription paused — payment failed
        </p>
        <p className="text-[13px] text-[#6B6560] mb-3">
          Update card to resume your {sub.productName ?? 'delivery'} delivery
        </p>
        <button
          onClick={() => navigate('/account')}
          className="px-4 py-2 rounded-md text-sm font-semibold text-white"
          style={{ backgroundColor: '#B42C1F' }}
        >
          Update payment
        </button>
      </div>
    )
  }

  // Paused — placeholder (v1.1)
  if (sub.status === 'paused') {
    const resumeDay = sub.nextShipAt ? daysUntil(sub.nextShipAt) : null
    return (
      <div className="mx-4 rounded-md border border-[#E8DDD0] p-4 bg-[#F5EFE9]">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6560] mb-1">
          Your Subscription
        </p>
        <p className="font-display font-semibold text-[#1A1410] text-[15px] leading-snug mb-1">
          {resumeDay !== null ? `Resumes in ${resumeDay} day${resumeDay !== 1 ? 's' : ''}` : 'Subscription paused'}
        </p>
        <button
          disabled
          className="mt-2 px-4 py-2 rounded-md text-sm font-semibold border border-[#D4A574] text-[#D4A574] opacity-50 cursor-not-allowed"
        >
          Resume now
        </button>
        <p className="text-[11px] text-[#6B6560] mt-1">Coming in v1.1</p>
      </div>
    )
  }

  // Active — countdown + skip
  const days = sub.nextShipAt ? daysUntil(sub.nextShipAt) : null
  const editDay = sub.editByDeadline ? editDayLabel(sub.editByDeadline) : null

  async function handleSkip() {
    await actions.skipNext(sub!.id)
  }

  return (
    <div className="mx-4 rounded-md border border-[#E8DDD0] p-4 bg-white">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6560] mb-2">
        Your Subscription
      </p>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-[#1A1410] text-[15px] leading-snug">
            {sub.productName ?? 'Performance Blend'}
          </p>
          <p
            className="text-[13px] mt-0.5"
            style={{ color: sub.inEditWindow ? '#D4A574' : '#6B6560', fontStyle: sub.inEditWindow ? 'italic' : 'normal' }}
          >
            {days !== null ? `Ships in ${days} day${days !== 1 ? 's' : ''}` : 'Shipping soon'}
            {editDay ? ` · Edit by ${editDay}` : ''}
          </p>
        </div>
        <button
          onClick={handleSkip}
          className="shrink-0 px-3 py-1.5 rounded-md text-sm font-semibold border border-[#D4A574] text-[#D4A574]"
        >
          Skip
        </button>
      </div>
      <button
        onClick={() => navigate('/subscriptions')}
        className="mt-3 text-[13px] font-medium"
        style={{ color: '#D4A574' }}
      >
        View subscription →
      </button>
    </div>
  )
}
