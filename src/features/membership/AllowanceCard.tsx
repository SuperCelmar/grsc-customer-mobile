import type { MembershipAllowance } from '../../lib/api'

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

type AllowanceCardProps = {
  allowance: MembershipAllowance
}

export function AllowanceCard({ allowance }: AllowanceCardProps) {
  const remaining = allowance.balance
  const total = allowance.allowance_count
  const ratio = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0
  const left = daysLeft(allowance.ends_at)
  const isExhausted = allowance.status === 'Exhausted' || remaining <= 0
  const isExpired = allowance.status === 'Expired' || (left !== null && left === 0)
  const expiresSoon = !isExpired && left !== null && left <= 7

  return (
    <div
      data-testid="allowance-card"
      data-allowance-id={allowance.allowance_id}
      className="mx-4 rounded-md border border-[#E8DDD0] bg-white px-4 py-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#A0826D]">
            {allowance.category_name ?? 'Plan'}
          </p>
          <p className="mt-0.5 truncate text-base font-semibold text-[#1A1410]">
            {allowance.plan_name}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-light text-[#1A1410] leading-none tabular-nums">
            {remaining}
            <span className="text-sm text-[#6B6560]"> / {total}</span>
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-[#6B6560]">
            Remaining
          </p>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#F5EFE9]">
        <div
          className="h-full rounded-full bg-[#D4A574]"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-[#6B6560]">
          {isExpired
            ? 'Expired'
            : isExhausted
              ? 'Fully redeemed'
              : `Expires ${formatDate(allowance.ends_at)}`}
        </span>
        {expiresSoon && (
          <span className="font-semibold text-amber-700">
            {left} day{left === 1 ? '' : 's'} left
          </span>
        )}
      </div>
    </div>
  )
}
