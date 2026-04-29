import { useAvailableRewards } from '../../hooks/useCustomerProfile'
import type { LoyaltyReward } from '../../lib/api'

type Props = {
  customerId: string
  orderAmount: number
  selectedRewardId: string | null
  onSelect: (reward: LoyaltyReward | null) => void
}

export function RewardPicker({ customerId, orderAmount, selectedRewardId, onSelect }: Props) {
  const { data, isLoading } = useAvailableRewards(customerId, orderAmount)
  const rewards = (data?.rewards ?? []).filter(
    r => r.type === 'CASHBACK' && r.isEligible && (r.cashback?.maxRedeemableNow ?? 0) > 0,
  )

  if (isLoading || rewards.length === 0) return null

  return (
    <div className="pt-2">
      <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">
        Rewards
      </label>
      <div className="space-y-2">
        {rewards.map(r => {
          const selected = r.id === selectedRewardId
          const amount = r.cashback?.maxRedeemableNow ?? 0
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(selected ? null : r)}
              className="w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors"
              style={{
                borderColor: selected ? 'var(--primary)' : 'var(--card)',
                backgroundColor: selected ? 'var(--muted)' : 'white',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--text)]">{r.name}</span>
                <span className="font-semibold" style={{ color: 'var(--primary)' }}>
                  −₹{amount.toFixed(0)}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{r.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
