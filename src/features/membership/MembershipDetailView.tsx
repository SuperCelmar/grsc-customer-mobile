import type { CustomerProfile } from '../../lib/api'

const TIER_COLORS: Record<string, string> = {
  pro: '#A0826D',
  elite: '#C9A961',
  legend: '#D4A574',
}

const TIER_CASHBACK: Record<string, number> = {
  pro: 5,
  elite: 10,
  legend: 15,
}

const TIER_LABELS: Record<string, string> = {
  pro: 'Pro',
  elite: 'Elite',
  legend: 'Legend',
}

function daysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

type MembershipDetailViewProps = {
  membership: NonNullable<CustomerProfile['membership']>
  onUpgrade?: () => void
}

export function MembershipDetailView({ membership, onUpgrade }: MembershipDetailViewProps) {
  const tier = membership.tier
  const color = TIER_COLORS[tier] ?? '#D4A574'
  const cashbackRate = TIER_CASHBACK[tier] ?? 0
  const label = TIER_LABELS[tier] ?? tier
  const isExpired = membership.status === 'Expired'
  const allowanceDaysLeft = daysLeft(membership.allowance_ends_at)
  const expiresWithin7Days =
    !isExpired &&
    membership.allowance_ends_at !== null &&
    (allowanceDaysLeft ?? Infinity) <= 7

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF]">
      <div className="px-4 pt-10 pb-4">
        <h1 className="font-serif text-2xl font-bold text-[#1A1410]">Membership</h1>
      </div>

      {/* Status banner */}
      {isExpired && (
        <div className="mx-4 mb-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm font-semibold text-red-700">Your membership has expired</p>
          <p className="text-xs text-red-500 mt-0.5">
            Renew at any GoldRush store to unlock your cashback balance.
          </p>
        </div>
      )}
      {expiresWithin7Days && (
        <div className="mx-4 mb-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-sm font-semibold text-amber-700">
            Expires in {allowanceDaysLeft} day{allowanceDaysLeft !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            Visit any GoldRush store to renew.
          </p>
        </div>
      )}

      {/* Membership card */}
      <div
        className="mx-4 rounded-xl border-2 p-5"
        style={{ borderColor: color }}
      >
        {/* Tier badge */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-full"
            style={{ backgroundColor: color + '22', color }}
          >
            {label} Member
          </span>
          {isExpired && (
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
              Expired
            </span>
          )}
        </div>

        {/* Dates */}
        <div className="flex gap-6 mb-4 text-sm">
          <div>
            <p className="text-[#6B6560] text-xs">Allowance started</p>
            <p className="font-semibold text-[#1A1410]">
              {formatDate(membership.allowance_starts_at)}
            </p>
          </div>
          <div>
            <p className="text-[#6B6560] text-xs">Allowance ends</p>
            <p className="font-semibold text-[#1A1410]">
              {formatDate(membership.allowance_ends_at)}
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div>
          <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide mb-2">
            Benefits
          </p>
          <ul className="space-y-2 text-sm text-[#1A1410]">
            <li className="flex justify-between">
              <span className="text-[#6B6560]">Cashback rate</span>
              <span className="font-semibold">{cashbackRate}%</span>
            </li>
            {tier !== 'legend' && (
              <li className="flex justify-between">
                <span className="text-[#6B6560]">Free coffees remaining</span>
                <span className="font-semibold">{membership.free_coffee_balance}</span>
              </li>
            )}
            {membership.allowance_ends_at && !isExpired && (
              <li className="flex justify-between">
                <span className="text-[#6B6560]">Days left</span>
                <span className="font-semibold">{allowanceDaysLeft ?? '—'}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Upgrade / Legend promo */}
      {tier === 'pro' && onUpgrade && (
        <div className="mx-4 mt-4 rounded-lg bg-[#F5EFE9] p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1A1410]">Upgrade to Elite</p>
            <p className="text-xs text-[#6B6560] mt-0.5">10% cashback + 20 free coffees</p>
          </div>
          <button
            onClick={onUpgrade}
            className="text-xs font-semibold text-[#C9A961] underline"
          >
            See how →
          </button>
        </div>
      )}
      {tier === 'elite' && (
        <div className="mx-4 mt-4 rounded-lg bg-[#F5EFE9] p-4">
          <p className="text-sm font-semibold text-[#1A1410]">Earn Legend status</p>
          <p className="text-xs text-[#6B6560] mt-1">
            Keep spending as an Elite member to unlock 15% cashback and a daily free coffee.
          </p>
        </div>
      )}
      {tier === 'legend' && (
        <div className="mx-4 mt-4 rounded-lg bg-[#F5EFE9] p-4">
          <p className="text-sm font-semibold text-[#1A1410]">You're on the best plan!</p>
          <p className="text-xs text-[#6B6560] mt-1">
            Legend status gives you 15% cashback and a daily free coffee.
          </p>
        </div>
      )}
    </div>
  )
}
