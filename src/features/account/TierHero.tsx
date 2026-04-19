import { MembershipDetailView } from '../membership/MembershipDetailView'
import { TierComparisonView } from '../membership/TierComparisonView'
import type { AccountProfile } from './types'

type TierHeroProps = {
  profile: AccountProfile
}

export function TierHero({ profile }: TierHeroProps) {
  const membership = profile.membership

  if (!membership) {
    return <TierComparisonView currentTier={null} />
  }

  const lifetime = profile.lifetime_coffees ?? null

  return (
    <div>
      <MembershipDetailView membership={membership} embedded />
      {lifetime !== null && lifetime !== undefined && (
        <div className="mx-4 mt-3 flex justify-between text-sm">
          <span className="text-[#6B6560]">Coffees enjoyed</span>
          <span className="font-semibold text-[#1A1410]">{lifetime}</span>
        </div>
      )}
    </div>
  )
}
