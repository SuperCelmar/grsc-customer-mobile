import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TierGuard } from '../TierGuard'
import type { MembershipStatus } from '../useMembershipStatus'

const mockStatus: { value: MembershipStatus } = { value: 'loading' }

vi.mock('../useMembershipStatus', () => ({
  useMembershipStatus: () => mockStatus.value,
}))

const mockNavigateTo: { value: string | null } = { value: null }
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => {
      mockNavigateTo.value = to
      return <div data-testid="navigate" data-to={to} />
    },
  }
})

function renderGuard(require: 'active-member' | 'any-member', status: MembershipStatus) {
  mockStatus.value = status
  mockNavigateTo.value = null
  const result = render(
    <MemoryRouter>
      <TierGuard require={require} fallback="/dashboard">
        <div data-testid="child">Protected Content</div>
      </TierGuard>
    </MemoryRouter>
  )
  return result
}

describe('TierGuard', () => {
  it('shows spinner while loading', () => {
    const { container } = renderGuard('active-member', 'loading')
    expect(container.querySelector('.animate-spin')).toBeTruthy()
    expect(screen.queryByTestId('child')).toBeNull()
  })

  it('redirects expired member when require=active-member', () => {
    renderGuard('active-member', 'expired')
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/dashboard')
    expect(screen.queryByTestId('child')).toBeNull()
  })

  it('redirects non-member when require=active-member', () => {
    renderGuard('active-member', 'non-member')
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/dashboard')
    expect(screen.queryByTestId('child')).toBeNull()
  })

  it('allows active-member when require=active-member', () => {
    renderGuard('active-member', 'active-member')
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.queryByTestId('navigate')).toBeNull()
  })

  it('allows active-member when require=any-member', () => {
    renderGuard('any-member', 'active-member')
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('allows expired member when require=any-member', () => {
    renderGuard('any-member', 'expired')
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('redirects non-member when require=any-member', () => {
    renderGuard('any-member', 'non-member')
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/dashboard')
    expect(screen.queryByTestId('child')).toBeNull()
  })
})
