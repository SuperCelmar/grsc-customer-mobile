import { useNavigate } from 'react-router-dom'
import type { AccountProfile } from './types'
import { AllowanceCard } from '../membership/AllowanceCard'

type TierHeroProps = {
  profile: AccountProfile
  firstName?: string | null
}

export function TierHero({ profile, firstName }: TierHeroProps) {
  const navigate = useNavigate()
  const allowances = (profile.allowances ?? []).filter(a => a.status === 'Active')
  const hasAllowances = allowances.length > 0

  return (
    <div data-testid="tier-hero" data-firstname={firstName ?? ''}>
      <p className="px-4 pt-3 pb-1 text-sm text-[#6B6560]">
        {firstName
          ? <>Hi, <span className="font-semibold text-[#1A1410]">{firstName}</span></>
          : 'Welcome back'}
      </p>

      {hasAllowances ? (
        <div className="flex flex-col gap-3 pt-1">
          {allowances.map(allowance => (
            <AllowanceCard key={allowance.allowance_id} allowance={allowance} />
          ))}
        </div>
      ) : (
        <div className="mx-4 mt-2 rounded-md border border-dashed border-[#E8DDD0] bg-white p-5 text-center">
          <p className="text-sm font-semibold text-[#1A1410]">No active plan</p>
          <p className="mt-1 text-xs text-[#6B6560]">
            Pick a plan to unlock free items every month.
          </p>
          <button
            type="button"
            onClick={() => navigate('/membership/plans')}
            className="mt-3 rounded-md bg-[#D4A574] px-4 py-2 text-sm font-semibold text-white"
          >
            Browse Plans
          </button>
        </div>
      )}
    </div>
  )
}
