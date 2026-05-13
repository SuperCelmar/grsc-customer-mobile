import { Wallet } from 'lucide-react'
import type { AccountProfile } from './types'

type Props = {
  profile: AccountProfile
}

export function CashbackStrip({ profile }: Props) {
  const balance = profile.wallet?.cashback_balance ?? null
  const isMember = (profile.allowances ?? []).some(a => a.status === 'Active')

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
        <div className="text-right shrink-0 pl-3 border-l border-[#E8DDD0]">
          <p className="text-sm font-semibold text-[#1A1410]">10% cashback</p>
          <p className="text-xs text-[#6B6560] mt-0.5">
            {isMember ? 'Active member' : 'On every order'}
          </p>
        </div>
      </div>
    </div>
  )
}
