import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  api: {
    listAddresses: vi.fn().mockResolvedValue([]),
  },
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
  customer: { id: 'c-1', name: 'Celmar', phone: '9876543210', email: null, created_at: '2026-01-01' },
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
  TierHero: ({ profile }: { profile: { membership: unknown } }) => (
    <div data-testid="tier-hero">
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

vi.mock('../AddressesAccordion', () => ({
  AddressesAccordion: () => <div data-testid="addresses-accordion" />,
}))

vi.mock('../PaymentsAccordion', () => ({
  PaymentsAccordion: () => <div data-testid="payments-accordion" />,
}))

vi.mock('../ReferralAccordion', () => ({
  ReferralAccordion: () => <div data-testid="referral-accordion" />,
}))

vi.mock('../SettingsAccordion', () => ({
  SettingsAccordion: () => <div data-testid="settings-accordion" />,
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

  it('renders all section accordions', () => {
    render(<AccountScreen />)
    expect(screen.getByTestId('subscription-accordion')).toBeInTheDocument()
    expect(screen.getByTestId('cashback-strip')).toBeInTheDocument()
    expect(screen.getByTestId('addresses-accordion')).toBeInTheDocument()
    expect(screen.getByTestId('payments-accordion')).toBeInTheDocument()
    expect(screen.getByTestId('referral-accordion')).toBeInTheDocument()
    expect(screen.getByTestId('settings-accordion')).toBeInTheDocument()
  })
})
