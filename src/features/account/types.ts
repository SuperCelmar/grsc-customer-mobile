import type { CustomerProfile } from '../../lib/api'

export type AccountProfile = CustomerProfile & {
  cashback_balance?: number | null
  lifetime_coffees?: number | null
  referral_code?: string | null
}
