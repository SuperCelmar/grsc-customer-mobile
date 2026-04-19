import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReferralAccordion } from '../ReferralAccordion'
import type { AccountProfile } from '../types'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('lucide-react', () => ({
  Gift: () => null,
  Copy: () => null,
  Check: () => null,
  ChevronDown: () => null,
  ChevronLeft: () => null,
  User: () => null,
  ShoppingBag: () => null,
}))

const baseProfile: AccountProfile = {
  success: true,
  customer: { id: 'c-1', name: 'Celmar', phone: '9876543210', email: null, created_at: '2026-01-01' },
  membership: {
    membership_id: 'mem-1',
    tier: 'pro',
    status: 'Active',
    free_coffee_balance: 8,
    allowance_starts_at: '2026-03-01',
    allowance_ends_at: '2026-06-01',
    daily_coffee_start_date: null,
  },
  wallet: { cashback_balance: 500, potential_cashback_balance: 0, cashback_lifetime_earned: 1200 },
  recent_transactions: [],
  referral_code: 'GRSCTEST1',
}

beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  })
})

async function openAccordion() {
  const header = screen.getByRole('button', { name: /Refer a friend/i })
  await userEvent.click(header)
}

describe('ReferralAccordion — referral code from profile', () => {
  it('shows referral code in expanded content', async () => {
    render(<ReferralAccordion profile={baseProfile} />)
    await openAccordion()
    expect(screen.getByText('GRSCTEST1')).toBeInTheDocument()
  })

  it('copy button calls navigator.clipboard.writeText with the code', async () => {
    render(<ReferralAccordion profile={baseProfile} />)
    await openAccordion()
    const copyBtn = screen.getByRole('button', { name: /Copy code/i })
    await userEvent.click(copyBtn)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('GRSCTEST1')
  })

  it('shows "Earn ₹100" pill in header', () => {
    render(<ReferralAccordion profile={baseProfile} />)
    expect(screen.getByText(/Earn ₹100/i)).toBeInTheDocument()
  })
})

describe('ReferralAccordion — derived code from phone', () => {
  it('derives code from last 6 digits of phone when referral_code is absent', async () => {
    const profile: AccountProfile = { ...baseProfile, referral_code: null }
    render(<ReferralAccordion profile={profile} />)
    await openAccordion()
    // phone 9876543210 → last 6 = 543210
    expect(screen.getByText('GRSC543210')).toBeInTheDocument()
  })

  it('falls back to GRSC000000 when phone is missing', async () => {
    const profile: AccountProfile = {
      ...baseProfile,
      referral_code: null,
      customer: { ...baseProfile.customer, phone: '' },
    }
    render(<ReferralAccordion profile={profile} />)
    await openAccordion()
    expect(screen.getByText('GRSC000000')).toBeInTheDocument()
  })
})
