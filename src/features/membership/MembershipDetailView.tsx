import type { CustomerProfile } from '../../lib/api'

type TierKey = 'pro' | 'elite' | 'legend'

const TIER_CONFIG: Record<TierKey, {
  color: string
  label: string
  cashback: number
  freeCoffees: number | null
  haloShadow: string
}> = {
  pro: {
    color: '#A0826D',
    label: 'Pro Member',
    cashback: 5,
    freeCoffees: 10,
    haloShadow: 'shadow-[0_6px_20px_-12px_rgba(160,130,109,0.35)]',
  },
  elite: {
    color: '#C9A961',
    label: 'Elite Member',
    cashback: 10,
    freeCoffees: 20,
    haloShadow: 'shadow-[0_10px_30px_-15px_rgba(201,169,97,0.45)]',
  },
  legend: {
    color: '#D4A574',
    label: 'Legend Member',
    cashback: 15,
    freeCoffees: null,
    haloShadow: 'shadow-[0_12px_36px_-16px_rgba(212,165,116,0.55)]',
  },
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
  embedded?: boolean
}

export function MembershipDetailView({ membership, onUpgrade, embedded = false }: MembershipDetailViewProps) {
  const tier = (membership.tier as TierKey) ?? 'pro'
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.pro
  const { color, label, cashback: cashbackRate, freeCoffees: maxCoffees, haloShadow } = config
  const isExpired = membership.status === 'Expired'
  const allowanceDaysLeft = daysLeft(membership.allowance_ends_at)
  const expiresWithin7Days =
    !isExpired &&
    membership.allowance_ends_at !== null &&
    (allowanceDaysLeft ?? Infinity) <= 7

  const isLegend = tier === 'legend'
  const balance = membership.free_coffee_balance
  const ratio = maxCoffees && maxCoffees > 0 ? Math.max(0, Math.min(1, balance / maxCoffees)) : 0

  const ringSize = 80
  const ringRadius = 38
  const ringStroke = 2
  const circumference = 2 * Math.PI * ringRadius
  const dashOffset = circumference * (1 - ratio)

  const rootClass = embedded
    ? 'flex flex-col'
    : 'flex flex-col min-h-screen bg-[#FFFFFF]'

  return (
    <div className={rootClass}>
      {!embedded && (
        <div className="px-4 pt-10 pb-4">
          <h1 className="font-serif text-2xl font-bold text-[#1A1410]">Membership</h1>
        </div>
      )}

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

      {/* Vault Card */}
      <div
        className={`mx-4 relative overflow-hidden rounded-2xl border border-[#E8DDD0] bg-[#F5EFE9] px-6 pt-6 pb-5 text-[#1A1410] ${haloShadow}`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[radial-gradient(#1A1410_1px,transparent_1px)] [background-size:4px_4px]" />
        <div className="pointer-events-none absolute inset-0 opacity-40 bg-gradient-to-tr from-transparent via-white/60 to-transparent" />

        {/* Header */}
        <div className="relative flex items-start justify-between">
          <div className="flex flex-col">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.3em]"
              style={{ color }}
            >
              {label}
            </span>
            <div className="mt-1 h-px w-8" style={{ backgroundColor: color }} />
          </div>
          <span className="text-[9px] uppercase tracking-[0.25em] text-[#6B6560]">
            GoldRush Society
          </span>
        </div>

        {/* Centerpiece */}
        <div className="relative mt-6 mb-8 flex items-center gap-5">
          {!isLegend ? (
            <div className="relative flex shrink-0 items-center justify-center" style={{ width: ringSize, height: ringSize }}>
              <svg width={ringSize} height={ringSize} className="-rotate-90">
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  stroke="#E8DDD0"
                  strokeWidth={ringStroke}
                  fill="none"
                />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  stroke={color}
                  strokeWidth={ringStroke}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <span
                className="absolute font-serif text-2xl italic"
                style={{ color }}
              >
                {balance}
              </span>
            </div>
          ) : (
            <div
              className="flex shrink-0 items-center justify-center"
              style={{ width: ringSize, height: ringSize }}
            >
              <span className="font-serif text-5xl font-light leading-none" style={{ color }}>
                ∞
              </span>
            </div>
          )}

          <div className="flex flex-col">
            <span
              className={`${isLegend ? 'font-serif italic' : ''} text-3xl font-light leading-none tracking-tight`}
            >
              {isLegend ? 'Unlimited' : `${balance} ${balance === 1 ? 'Coffee' : 'Coffees'}`}
            </span>
            <span className="mt-2 text-[10px] uppercase tracking-[0.25em] text-[#6B6560]">
              {isLegend ? 'Daily Allowance' : 'Remaining Allowance'}
            </span>
          </div>
        </div>

        {/* Footer metadata strip */}
        <div className="relative flex items-end justify-between border-t border-[#E8DDD0]/70 pt-4">
          <div className="flex gap-7">
            <div className="flex flex-col">
              <span className="mb-1 text-[9px] uppercase tracking-[0.25em] text-[#6B6560]">
                Valid Thru
              </span>
              <span className="text-xs font-medium tabular-nums">
                {formatDate(membership.allowance_ends_at)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="mb-1 text-[9px] uppercase tracking-[0.25em] text-[#6B6560]">
                Cashback
              </span>
              <span className="text-xs font-medium tabular-nums">{cashbackRate}%</span>
            </div>
            {!isLegend && !isExpired && membership.allowance_ends_at && (
              <div className="flex flex-col">
                <span className="mb-1 text-[9px] uppercase tracking-[0.25em] text-[#6B6560]">
                  Days Left
                </span>
                <span className="text-xs font-medium tabular-nums">{allowanceDaysLeft ?? '—'}</span>
              </div>
            )}
          </div>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="1.25"
            className="opacity-30"
          >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>
      </div>

      {/* Upgrade / Legend promo */}
      {!embedded && tier === 'pro' && onUpgrade && (
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
      {!embedded && tier === 'elite' && (
        <div className="mx-4 mt-4 rounded-lg bg-[#F5EFE9] p-4">
          <p className="text-sm font-semibold text-[#1A1410]">Earn Legend status</p>
          <p className="text-xs text-[#6B6560] mt-1">
            Keep spending as an Elite member to unlock 15% cashback and a daily free coffee.
          </p>
        </div>
      )}
      {!embedded && tier === 'legend' && (
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
