import type { ReactNode } from 'react'
import { MapPin } from 'lucide-react'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useCustomerProfile } from '../../hooks/useCustomerProfile'
import { useSubscriptions } from '../subscriptions/useSubscriptions'
import { TierHero } from './TierHero'
import { SubscriptionAccordion } from './SubscriptionAccordion'
import { CashbackStrip } from './CashbackStrip'
import { PaymentsAccordion } from './PaymentsAccordion'
import { ReferralAccordion } from './ReferralAccordion'
import { SettingsAccordion } from './SettingsAccordion'
import type { AccountProfile } from './types'

// Read-only single-address card. Edit path is gated on a backend
// profile-update edge fn that does not yet exist (Plan §Step 1 check 5).
function AddressCard({ profile }: { profile: AccountProfile }) {
  const c = profile.customer
  const hasAddress = !!c?.address_line1
  return (
    <div data-testid="address-card" className="mx-4 mt-2 bg-white border border-[#E8DDD0] rounded-md px-3 py-3">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-4 h-4 text-[#6B6560]" />
        <p className="text-sm font-semibold text-[#1A1410]">Delivery Address</p>
      </div>
      {hasAddress ? (
        <div className="text-sm text-[#1A1410]">
          <p>
            {c.address_line1}
            {c.address_line2 ? `, ${c.address_line2}` : ''}
          </p>
          <p className="text-xs text-[#6B6560]">
            {c.city}{c.state ? `, ${c.state}` : ''}{c.zip_code ? ` - ${c.zip_code}` : ''}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[#6B6560]">No address on file.</p>
      )}
      {/* TODO: add edit form once a profile-update edge fn (e.g. customer-profile-update) is available on the backend. */}
    </div>
  )
}

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
  const rawFirstName = data.customer?.name?.split(' ')[0]
  const firstName = rawFirstName?.trim() ? rawFirstName.trim() : null

  return (
    <div className="flex flex-col min-h-screen bg-white pb-24">
      <ScreenHeader title="Account" />

      <TierHero profile={profile} firstName={firstName} />
      <CashbackStrip profile={profile} />

      <GroupLabel>Commerce</GroupLabel>
      <SubscriptionAccordion subscription={subs?.subscriptions?.[0] ?? null} />
      <AddressCard profile={profile} />
      <PaymentsAccordion />

      <GroupLabel>More</GroupLabel>
      <ReferralAccordion profile={profile} />
      <SettingsAccordion />
    </div>
  )
}
