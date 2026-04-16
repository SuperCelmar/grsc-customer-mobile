import { useState } from 'react'
import { useCustomerProfile } from '../../hooks/useCustomerProfile'
import { MembershipDetailView } from './MembershipDetailView'
import { TierComparisonView } from './TierComparisonView'

export function MembershipScreen() {
  const { data, isLoading, isError } = useCustomerProfile()
  const [showComparison, setShowComparison] = useState(false)

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
        <p className="text-[#6B6560] text-sm">Could not load membership data.</p>
      </div>
    )
  }

  const membership = data.membership

  // Non-member or showing comparison
  if (!membership || showComparison) {
    return (
      <TierComparisonView
        currentTier={membership?.tier ?? null}
      />
    )
  }

  // Active or expired member — show detail view
  return (
    <MembershipDetailView
      membership={membership}
      onUpgrade={membership.tier === 'pro' ? () => setShowComparison(true) : undefined}
    />
  )
}
