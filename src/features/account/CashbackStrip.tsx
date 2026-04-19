import { Wallet } from 'lucide-react'
import type { AccountProfile } from './types'

const TIER_RATE: Record<string, number> = { pro: 5, elite: 10, legend: 15 }

type Props = {
  profile: AccountProfile
}

export function CashbackStrip({ profile }: Props) {
  const balance = profile.wallet?.cashback_balance ?? null
  const tier = profile.membership?.tier ?? null
  const rate = tier ? TIER_RATE[tier] : null

  return (
    <div className="mx-4 mt-3 rounded-lg border border-[#E8DDD0] bg-[#FDFCFB] p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-[#D4A574] flex items-center justify-center shrink-0">
        <Wallet className="w-5 h-5 text-white" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-2xl font-extrabold text-[#D4A574] leading-tight">
            {balance !== null ? `₹${balance}` : '—'}
          </p>
          <p className="text-xs text-[#6B6560] mt-0.5">Your cashback</p>
        </div>
        {rate && tier ? (
          <div className="text-right shrink-0 pl-3 border-l border-[#E8DDD0]">
            <p className="text-sm font-semibold text-[#1A1410]">{rate}% tier rate</p>
            <p className="text-xs text-[#6B6560] mt-0.5">{tier.charAt(0).toUpperCase() + tier.slice(1)} member</p>
          </div>
        ) : (
          <p className="text-xs text-[#6B6560] text-right shrink-0">Earn cashback on every order</p>
        )}
      </div>
    </div>
  )
}
