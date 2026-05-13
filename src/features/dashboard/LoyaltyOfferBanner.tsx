import { Clock, Sparkles } from 'lucide-react'
import { FreeCoffeeRing } from './FreeCoffeeRing'
import type { MembershipAllowance } from '../../lib/api'

type Props = {
  variant: 'active' | 'expired' | 'non-member'
  allowances?: MembershipAllowance[]
  cashbackBalance?: number
  potentialCashback?: number
  onCTA: () => void
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  const target = new Date(dateStr)
  const diffMs = target.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function LoyaltyOfferBanner({
  variant,
  allowances,
  cashbackBalance,
  potentialCashback,
  onCTA,
}: Props) {
  const activeAllowances = (allowances ?? []).filter(a => a.status === 'Active')
  const primary = activeAllowances[0] ?? null

  let expiryNode: React.ReactNode = null
  if (variant === 'active' && primary?.ends_at) {
    const days = daysUntil(primary.ends_at)
    if (days <= 0) {
      expiryNode = (
        <p className="text-[11px] font-normal mt-0.5" style={{ color: '#B42C1F' }}>
          Expires today — Renew now!
        </p>
      )
    } else if (days <= 7) {
      expiryNode = (
        <p className="text-[11px] font-normal text-text-secondary mt-0.5">
          Expires in {days} day{days !== 1 ? 's' : ''}
        </p>
      )
    }
  }

  return (
    <div className="mx-4 bg-white rounded-md border border-card p-4 flex flex-col gap-3">
      {variant === 'active' && primary && (
        <>
          <div className="flex items-center gap-3">
            <FreeCoffeeRing
              remaining={primary.balance}
              total={primary.allowance_count}
              color="#D4A574"
            />
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-semibold text-text-dark leading-tight">
                {primary.plan_name}
              </p>
              <p className="text-[11px] font-normal text-text-secondary mt-0.5">
                {primary.balance} of {primary.allowance_count} {primary.category_name ?? 'items'} · ₹{(cashbackBalance ?? 0).toFixed(2)} cashback
              </p>
              {expiryNode}
              {activeAllowances.length > 1 && (
                <p className="text-[11px] font-normal text-text-secondary mt-0.5">
                  +{activeAllowances.length - 1} more plan{activeAllowances.length - 1 === 1 ? '' : 's'}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onCTA}
            className="w-full rounded-md py-2.5 text-sm font-semibold text-center active:scale-95 transition-transform duration-100"
            style={{ backgroundColor: '#D4A574', color: '#1A1410' }}
          >
            View Rewards
          </button>
        </>
      )}

      {variant === 'expired' && (
        <>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-full bg-muted flex-shrink-0"
              style={{ width: 48, height: 48 }}
            >
              <Clock size={24} className="text-text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-semibold text-text-dark leading-tight">
                Membership expired
              </p>
              {cashbackBalance !== undefined && (
                <p className="text-[11px] font-normal text-text-secondary mt-0.5">
                  ₹{cashbackBalance.toFixed(2)} cashback waiting
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onCTA}
            className="w-full rounded-md py-2.5 text-sm font-semibold text-center active:scale-95 transition-transform duration-100"
            style={{ backgroundColor: '#D4A574', color: '#1A1410' }}
          >
            Browse plans
          </button>
        </>
      )}

      {variant === 'non-member' && (
        <>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-full bg-muted flex-shrink-0"
              style={{ width: 48, height: 48 }}
            >
              <Sparkles size={24} className="text-text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-semibold text-text-dark leading-tight">
                Unlock your rewards
              </p>
              <p className="text-[11px] font-normal text-text-secondary mt-0.5">
                {potentialCashback && potentialCashback > 0
                  ? `Earn ₹${potentialCashback.toFixed(2)} in cashback waiting`
                  : 'Join to earn 10% cashback and free items.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCTA}
            className="w-full rounded-md py-2.5 text-sm font-semibold text-center active:scale-95 transition-transform duration-100"
            style={{ backgroundColor: '#D4A574', color: '#1A1410' }}
          >
            Browse plans →
          </button>
        </>
      )}
    </div>
  )
}
