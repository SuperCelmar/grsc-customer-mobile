import { useCustomerProfile } from '../../hooks/useCustomerProfile'

export type MembershipStatus = 'active-member' | 'expired' | 'non-member' | 'loading'

export function useMembershipStatus(): MembershipStatus {
  const { data, isLoading } = useCustomerProfile()
  if (isLoading) return 'loading'
  const status = data?.membership?.status
  if (status === 'Active') return 'active-member'
  if (status === 'Expired') return 'expired'
  return 'non-member'
}
