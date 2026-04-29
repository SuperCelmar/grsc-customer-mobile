import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { OrderConfirmationScreen } from '../OrderConfirmationScreen'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockFetchOrderWithRetry = vi.fn()
vi.mock('../../orders/lib/fetchOrderWithRetry', () => ({
  fetchOrderWithRetry: (...args: unknown[]) => mockFetchOrderWithRetry(...args),
}))

const ORDER_ID = 'aabbccdd-1111-2222-3333-444455556666'

function renderConfirmation(orderId = ORDER_ID, secondary?: string) {
  const path = secondary
    ? `/order-confirmation/${orderId}?secondary=${secondary}`
    : `/order-confirmation/${orderId}`
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmationScreen />} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFetchOrderWithRetry.mockResolvedValue(null)
})

describe('OrderConfirmationScreen', () => {
  it('renders payment received heading and short order id immediately', () => {
    renderConfirmation()
    expect(screen.getByText(/Payment received/i)).toBeInTheDocument()
    expect(screen.getByText(/AABBCCDD/i)).toBeInTheDocument()
  })

  it('renders Track Order and Back to Menu CTAs', () => {
    renderConfirmation()
    expect(screen.getByRole('button', { name: /Track Order/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Back to Menu/i })).toBeInTheDocument()
  })

  it('navigates to /orders?active=<id> when Track Order clicked', async () => {
    renderConfirmation()
    await userEvent.click(screen.getByRole('button', { name: /Track Order/i }))
    expect(mockNavigate).toHaveBeenCalledWith(`/orders?active=${ORDER_ID}`)
  })

  it('navigates to /order when Back to Menu clicked', async () => {
    renderConfirmation()
    await userEvent.click(screen.getByRole('button', { name: /Back to Menu/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/order')
  })

  it('renders enrichment card when fetchOrderWithRetry resolves data', async () => {
    mockFetchOrderWithRetry.mockResolvedValue({
      fulfillment_status: 'PLACED',
      source_order_id: 'PP-999',
      payment_status: null,
      order_fulfillment_events: [],
      total_amount: 350,
      store_name: 'GoldRush Cafe',
    })
    renderConfirmation()
    expect(await screen.findByText('GoldRush Cafe')).toBeInTheDocument()
    expect(await screen.findByText(/Total:.*350/i)).toBeInTheDocument()
  })

  it('falls back to minimal card (no enrichment card) when fetch returns null', async () => {
    mockFetchOrderWithRetry.mockResolvedValue(null)
    renderConfirmation()
    expect(screen.getByText(/Payment received/i)).toBeInTheDocument()
    // enrichment card does not appear
    expect(screen.queryByText(/Total:/i)).not.toBeInTheDocument()
  })

  it('renders secondary order chip when ?secondary= param is present', async () => {
    const secondary = 'bbccddee-2222-3333-4444-555566667777'
    renderConfirmation(ORDER_ID, secondary)
    expect(await screen.findByText(/BBCCDDEE/i)).toBeInTheDocument()
  })

  it('does not render secondary chip when ?secondary= is absent', () => {
    renderConfirmation()
    expect(screen.queryByText(/Shop order/i)).not.toBeInTheDocument()
  })
})
