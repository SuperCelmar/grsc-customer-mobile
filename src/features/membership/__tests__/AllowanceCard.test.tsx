import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AllowanceCard } from '../AllowanceCard'
import type { MembershipAllowance } from '../../../lib/api'

const base: MembershipAllowance = {
  allowance_id: 42,
  plan_id: 'plan-coffee-30',
  plan_name: 'Coffee 30',
  category_id: 'cat-coffee',
  category_name: 'Classic Coffee',
  balance: 8,
  allowance_count: 30,
  status: 'Active',
  starts_at: '2026-04-01',
  ends_at: '2026-06-01',
}

describe('AllowanceCard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-13T00:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders plan name, category, balance fraction', () => {
    render(<AllowanceCard allowance={base} />)
    expect(screen.getByText('Coffee 30')).toBeInTheDocument()
    expect(screen.getByText('Classic Coffee')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText(/\/ 30/)).toBeInTheDocument()
  })

  it('keys by allowance_id via data attribute', () => {
    render(<AllowanceCard allowance={base} />)
    expect(screen.getByTestId('allowance-card')).toHaveAttribute('data-allowance-id', '42')
  })

  it('shows expires-soon warning when ≤ 7 days remain', () => {
    const soon = { ...base, ends_at: '2026-05-17T00:00:00Z' }
    render(<AllowanceCard allowance={soon} />)
    expect(screen.getByText(/days left/i)).toBeInTheDocument()
  })

  it('shows "Fully redeemed" when status=Exhausted', () => {
    render(<AllowanceCard allowance={{ ...base, status: 'Exhausted', balance: 0 }} />)
    expect(screen.getByText(/Fully redeemed/i)).toBeInTheDocument()
  })

  it('shows "Expired" when status=Expired', () => {
    render(<AllowanceCard allowance={{ ...base, status: 'Expired' }} />)
    expect(screen.getByText(/^Expired$/)).toBeInTheDocument()
  })
})
