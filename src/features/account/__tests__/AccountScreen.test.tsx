import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AccountScreen } from '../AccountScreen'
import type { AccountProfile } from '../types'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/membership' }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: { signOut: vi.fn().mockResolvedValue({}) },
  },
}))

vi.mock('../../../lib/api', () => ({
  api: {},
}))

vi.mock('../../../lib/config', () => ({
  SUPPORT_WHATSAPP_E164: '919876543210',
}))

vi.mock('lucide-react', () => ({
  ChevronDown: () => null,
  ChevronLeft: () => null,
  User: () => null,
  ShoppingBag: () => null,
  Coffee: () => null,
  Wallet: () => null,
  MapPin: () => null,
  CreditCard: () => null,
  Gift: () => null,
  Settings: () => null,
  Copy: () => null,
  Check: () => null,
}))

const baseMembership = {
  membership_id: 'mem-1',
  tier: 'pro' as const,
  status: 'Active' as const,
  free_coffee_balance: 8,
  allowance_starts_at: '2026-03-01',
  allowance_ends_at: '2026-06-01',
  daily_coffee_start_date: null,
}

const baseProfile: AccountProfile = {
  success: true,
  customer: {
    id: 'c-1',
    name: 'Celmar',
    phone: '9876543210',
    email: null,
    created_at: '2026-01-01',
    address_line1: '123 Main St',
    address_line2: null,
    city: 'Hyderabad',
    state: 'Telangana',
    zip_code: '500001',
  },
  membership: baseMembership,
  wallet: { cashback_balance: 500, potential_cashback_balance: 0, cashback_lifetime_earned: 1200 },
  recent_transactions: [],
  cashback_balance: 500,
  lifetime_coffees: 42,
  referral_code: 'GRSCTEST1',
}

let mockProfile: AccountProfile | null = baseProfile
let mockIsLoading = false
let mockIsError = false

vi.mock('../../../hooks/useCustomerProfile', () => ({
  useCustomerProfile: () => ({
    data: mockProfile,
    isLoading: mockIsLoading,
    isError: mockIsError,
  }),
}))

vi.mock('../../subscriptions/useSubscriptions', () => ({
  useSubscriptions: () => ({ data: { success: true, subscriptions: [] } }),
}))

vi.mock('../TierHero', () => ({
  TierHero: ({ profile, firstName }: { profile: { membership: unknown }; firstName?: string | null }) => (
    <div data-testid="tier-hero" data-firstname={firstName ?? ''}>
      {profile.membership ? 'MembershipDetailView' : 'TierComparisonView'}
    </div>
  ),
}))

vi.mock('../SubscriptionAccordion', () => ({
  SubscriptionAccordion: () => <div data-testid="subscription-accordion" />,
}))

vi.mock('../CashbackStrip', () => ({
  CashbackStrip: () => <div data-testid="cashback-strip" />,
}))

vi.mock('../ReferralAccordion', () => ({
  ReferralAccordion: () => <div data-testid="referral-accordion" />,
}))

beforeEach(() => {
  mockProfile = baseProfile
  mockIsLoading = false
  mockIsError = false
  vi.clearAllMocks()
})

describe('AccountScreen', () => {
  it('shows spinner while loading', () => {
    mockIsLoading = true
    mockProfile = null
    render(<AccountScreen />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('shows error state when profile fails', () => {
    mockIsError = true
    mockProfile = null
    render(<AccountScreen />)
    expect(screen.getByText(/Could not load account data/i)).toBeInTheDocument()
  })

  it('renders Account heading for active member', () => {
    render(<AccountScreen />)
    expect(screen.getByRole('heading', { name: /Account/i })).toBeInTheDocument()
  })

  it('passes firstName to TierHero', () => {
    render(<AccountScreen />)
    expect(screen.getByTestId('tier-hero')).toHaveAttribute('data-firstname', 'Celmar')
  })

  it('passes null firstName to TierHero when name is null', () => {
    mockProfile = { ...baseProfile, customer: { ...baseProfile.customer!, name: null } }
    render(<AccountScreen />)
    expect(screen.getByTestId('tier-hero')).toHaveAttribute('data-firstname', '')
  })

  it('renders TierHero with active membership', () => {
    render(<AccountScreen />)
    expect(screen.getByTestId('tier-hero')).toBeInTheDocument()
    expect(screen.getByTestId('tier-hero')).toHaveTextContent('MembershipDetailView')
  })

  it('renders TierComparisonView for non-member', () => {
    mockProfile = { ...baseProfile, membership: null }
    render(<AccountScreen />)
    expect(screen.getByTestId('tier-hero')).toHaveTextContent('TierComparisonView')
  })

  it('renders the account hub summary region', () => {
    render(<AccountScreen />)

    expect(screen.getByRole('region', { name: /account summary/i })).toBeInTheDocument()
    expect(screen.getByTestId('cashback-strip')).toBeInTheDocument()
  })

  it('links the subscriptions quick action to the subscriptions route', () => {
    render(<AccountScreen />)

    expect(screen.getByRole('link', { name: /subscriptions/i })).toHaveAttribute('href', '/subscriptions')
  })

  it('surfaces payment support and settings without unsupported card management claims', async () => {
    const user = userEvent.setup()
    render(<AccountScreen />)

    const paymentToggle = screen.queryByRole('button', { name: /payment methods/i })
    if (paymentToggle) {
      await user.click(paymentToggle)
    }

    expect(screen.getByText(/Payment methods/i)).toBeInTheDocument()
    expect(screen.getByText(/cards are tokeni[sz]ed/i)).toBeInTheDocument()
    expect(screen.getByText(/don't store cards in-app/i)).toBeInTheDocument()

    const settingsToggle = screen.queryByRole('button', { name: /settings.*support/i })
    if (settingsToggle) {
      await user.click(settingsToggle)
    }

    expect(screen.getByText(/Contact support/i)).toBeInTheDocument()
    expect(screen.getByText(/Notification preferences/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /manage cards/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add card|edit card|update card/i })).not.toBeInTheDocument()
  })

  it('renders address from profile when present', () => {
    render(<AccountScreen />)
    expect(screen.getByText(/Delivery Address/i)).toBeInTheDocument()
    expect(screen.getByText(/123 Main St/)).toBeInTheDocument()
    expect(screen.getByText(/Hyderabad, Telangana - 500001/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit address|manage address/i })).not.toBeInTheDocument()
  })

  it('renders empty-state copy when profile has no address', () => {
    mockProfile = {
      ...baseProfile,
      customer: { ...baseProfile.customer!, address_line1: null, address_line2: null, city: null, state: null, zip_code: null },
    }
    render(<AccountScreen />)
    expect(screen.getByText(/No address on file/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit address|manage address/i })).not.toBeInTheDocument()
  })
})
