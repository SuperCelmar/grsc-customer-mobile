import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'

const mockReorder = vi.fn()
let mockCanReorder = false

vi.mock('../features/orders/useReorder', () => ({
  useReorder: () => ({ canReorder: mockCanReorder, reorder: mockReorder, isLoading: false }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockCanReorder = false
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<BottomNav />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('BottomNav', () => {
  it('renders 4 tabs with correct labels', () => {
    renderAt('/dashboard')
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Shop')).toBeInTheDocument()
    expect(screen.getByText('Reorder')).toBeInTheDocument()
    expect(screen.getByText('Account')).toBeInTheDocument()
  })

  it('marks Home active on /dashboard', () => {
    renderAt('/dashboard')
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toHaveAttribute('aria-current', 'page')
    expect(buttons[1]).not.toHaveAttribute('aria-current')
    expect(buttons[2]).not.toHaveAttribute('aria-current')
    expect(buttons[3]).not.toHaveAttribute('aria-current')
  })

  it('marks Shop active on /order', () => {
    renderAt('/order')
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).not.toHaveAttribute('aria-current')
    expect(buttons[1]).toHaveAttribute('aria-current', 'page')
    expect(buttons[2]).not.toHaveAttribute('aria-current')
    expect(buttons[3]).not.toHaveAttribute('aria-current')
  })

  it('marks Reorder active on /orders', () => {
    renderAt('/orders')
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).not.toHaveAttribute('aria-current')
    expect(buttons[1]).not.toHaveAttribute('aria-current')
    expect(buttons[2]).toHaveAttribute('aria-current', 'page')
    expect(buttons[3]).not.toHaveAttribute('aria-current')
  })

  it('marks Account active on /membership', () => {
    renderAt('/membership')
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).not.toHaveAttribute('aria-current')
    expect(buttons[1]).not.toHaveAttribute('aria-current')
    expect(buttons[2]).not.toHaveAttribute('aria-current')
    expect(buttons[3]).toHaveAttribute('aria-current', 'page')
  })

  it('clicking Account tab makes it active', async () => {
    const user = userEvent.setup()
    renderAt('/dashboard')
    const accountButton = screen.getByText('Account').closest('button')!
    await user.click(accountButton)
    expect(accountButton).toHaveAttribute('aria-current', 'page')
  })

  it('clicking Reorder tab calls reorder() when canReorder is true', async () => {
    mockCanReorder = true
    const user = userEvent.setup()
    renderAt('/dashboard')
    const reorderButton = screen.getByText('Reorder').closest('button')!
    await user.click(reorderButton)
    expect(mockReorder).toHaveBeenCalledOnce()
  })

  it('clicking Reorder tab navigates to /orders when canReorder is false', async () => {
    mockCanReorder = false
    const user = userEvent.setup()
    renderAt('/dashboard')
    const reorderButton = screen.getByText('Reorder').closest('button')!
    await user.click(reorderButton)
    expect(mockReorder).not.toHaveBeenCalled()
    // After clicking, /orders path should be active (Reorder tab highlighted)
    expect(reorderButton).toHaveAttribute('aria-current', 'page')
  })
})
