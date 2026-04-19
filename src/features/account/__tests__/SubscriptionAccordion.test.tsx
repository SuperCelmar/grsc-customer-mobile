import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SubscriptionAccordion } from '../SubscriptionAccordion'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('lucide-react', () => ({
  Coffee: () => null,
  ChevronDown: () => null,
  ChevronLeft: () => null,
  User: () => null,
  ShoppingBag: () => null,
}))

const activeSub = {
  id: 'sub-1',
  product_id: 'prod-1',
  product_name: 'Performance Coffee',
  variant_id: 'var-1',
  variant_name: 'Whole Bean 250g',
  image_url: null,
  interval: 'month' as const,
  interval_count: 1,
  next_shipment_at: '2026-05-12T00:00:00Z',
  last_charged_at: '2026-04-12T00:00:00Z',
  status: 'active' as const,
  price_snapshot: 140000,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SubscriptionAccordion — no subscription', () => {
  it('shows "No active subscription" summary', () => {
    render(<SubscriptionAccordion subscription={null} />)
    expect(screen.getByText(/No active subscription/i)).toBeInTheDocument()
  })

  it('shows CTA to subscribe when expanded', async () => {
    render(<SubscriptionAccordion subscription={null} />)
    const header = screen.getByRole('button', { name: /Performance Coffee Subscription/i })
    await userEvent.click(header)
    expect(screen.getByRole('button', { name: /Subscribe to Performance Coffee/i })).toBeInTheDocument()
  })

  it('CTA navigates to performance coffee order page', async () => {
    render(<SubscriptionAccordion subscription={null} />)
    const header = screen.getByRole('button', { name: /Performance Coffee Subscription/i })
    await userEvent.click(header)
    await userEvent.click(screen.getByRole('button', { name: /Subscribe to Performance Coffee/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/order?category=online-performance-coffee')
  })
})

describe('SubscriptionAccordion — active subscription', () => {
  it('shows next shipment summary and price when collapsed', async () => {
    render(<SubscriptionAccordion subscription={activeSub} />)
    // close the accordion first (it defaults open when sub exists)
    const header = screen.getByRole('button', { name: /Performance Coffee Subscription/i })
    await userEvent.click(header)
    expect(screen.getByText(/Next shipment/i)).toBeInTheDocument()
    // price_snapshot 140000 paise → ₹1400 (no comma formatting)
    expect(screen.getByText(/₹1400/i)).toBeInTheDocument()
  })

  it('is auto-expanded when subscription exists', () => {
    render(<SubscriptionAccordion subscription={activeSub} />)
    expect(screen.getByText(/Whole Bean 250g/i)).toBeInTheDocument()
  })

  it('shows interval and next shipment rows when expanded', () => {
    render(<SubscriptionAccordion subscription={activeSub} />)
    expect(screen.getByText(/Interval/i)).toBeInTheDocument()
    expect(screen.getByText(/Next shipment/i)).toBeInTheDocument()
  })

  it('Skip next and Pause buttons are disabled', () => {
    render(<SubscriptionAccordion subscription={activeSub} />)
    const skipBtn = screen.getByRole('button', { name: /Skip next/i })
    const pauseBtn = screen.getByRole('button', { name: /Pause/i })
    expect(skipBtn).toBeDisabled()
    expect(pauseBtn).toBeDisabled()
  })
})
