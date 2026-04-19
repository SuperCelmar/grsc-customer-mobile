import type { ReactNode } from 'react'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useCustomerProfile } from '../../hooks/useCustomerProfile'
import { useSubscriptions } from '../subscriptions/useSubscriptions'
import { TierHero } from './TierHero'
import { SubscriptionAccordion } from './SubscriptionAccordion'
import { CashbackStrip } from './CashbackStrip'
import { AddressesAccordion } from './AddressesAccordion'
import { PaymentsAccordion } from './PaymentsAccordion'
import { ReferralAccordion } from './ReferralAccordion'
import { SettingsAccordion } from './SettingsAccordion'
import type { AccountProfile } from './types'

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mx-4 mt-6 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#6B6560]">
      {children}
    </p>
  )
}

export function AccountScreen() {
  const { data, isLoading, isError } = useCustomerProfile()
  const { data: subs } = useSubscriptions()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-[#D4A574] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <p className="text-[#6B6560] text-sm">Could not load account data.</p>
      </div>
    )
  }

  const profile = data as AccountProfile

  return (
    <div className="flex flex-col min-h-screen bg-white pb-24">
      <ScreenHeader title="Account" />

      <TierHero profile={profile} />
      <CashbackStrip profile={profile} />

      <GroupLabel>Commerce</GroupLabel>
      <SubscriptionAccordion subscription={subs?.subscriptions?.[0] ?? null} />
      <AddressesAccordion />
      <PaymentsAccordion />

      <GroupLabel>More</GroupLabel>
      <ReferralAccordion profile={profile} />
      <SettingsAccordion />
    </div>
  )
}
