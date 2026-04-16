import { Clock, Sparkles } from 'lucide-react'
import { FreeCoffeeRing } from './FreeCoffeeRing'
import { TierBadge } from './TierBadge'

type Props = {
  variant: 'active' | 'expired' | 'non-member'
  tier?: 'pro' | 'elite' | 'legend'
  freeCoffeeBalance?: number
  cashbackBalance?: number
  potentialCashback?: number
  allowanceEndsAt?: string | null
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
  tier,
  freeCoffeeBalance,
  cashbackBalance,
  potentialCashback,
  allowanceEndsAt,
  onCTA,
}: Props) {
  const ringColor =
    tier === 'elite' ? '#C9A961' : tier === 'legend' ? '#D4A574' : '#A0826D'
  const ringTotal = tier === 'elite' || tier === 'legend' ? 20 : 10

  let expiryNode: React.ReactNode = null
  if (variant === 'active' && allowanceEndsAt) {
    const days = daysUntil(allowanceEndsAt)
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
      {variant === 'active' && (
        <>
          <div className="flex items-center gap-3">
            <FreeCoffeeRing
              remaining={freeCoffeeBalance ?? 0}
              total={ringTotal}
              color={ringColor}
            />
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-semibold text-text-dark leading-tight">
                Your rewards
              </p>
              <p className="text-[11px] font-normal text-text-secondary mt-0.5">
                {freeCoffeeBalance ?? 0} free coffee(s) · ₹{(cashbackBalance ?? 0).toFixed(2)} cashback
              </p>
              {expiryNode}
            </div>
            <TierBadge tier={tier!} size="sm" />
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
            Renew your membership
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
                  : 'Join to earn cashback and free coffees.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCTA}
            className="w-full rounded-md py-2.5 text-sm font-semibold text-center active:scale-95 transition-transform duration-100"
            style={{ backgroundColor: '#D4A574', color: '#1A1410' }}
          >
            Become a Pro Member →
          </button>
        </>
      )}
    </div>
  )
}
