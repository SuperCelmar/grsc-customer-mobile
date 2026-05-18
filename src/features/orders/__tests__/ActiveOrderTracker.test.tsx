import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ActiveOrderTracker } from '../ActiveOrderTracker'
import { api } from '../../../lib/api'

const mockUnsubscribe = vi.fn()
const mockSubscribe = vi.fn().mockReturnThis()
const mockOn = vi.fn().mockReturnThis()
const mockChannel = { on: mockOn, subscribe: mockSubscribe, unsubscribe: mockUnsubscribe }

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => mockChannel),
  },
}))

vi.mock('../../../lib/api', () => ({
  api: { cancelOrder: vi.fn() },
}))

const mockInvalidateQueries = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}))

const mockFetchOrderWithRetry = vi.fn()
vi.mock('../lib/fetchOrderWithRetry', () => ({
  fetchOrderWithRetry: (...args: unknown[]) => mockFetchOrderWithRetry(...args),
}))

function makeOrderData(fulfillment_status: string, events: object[] = [], extra: object = {}) {
  return {
    fulfillment_status,
    source_order_id: 'PP-12345',
    payment_status: null,
    order_fulfillment_events: events,
    ...extra,
  }
}

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000'

function renderTracker(orderId: string) {
  return render(
    <MemoryRouter>
      <ActiveOrderTracker orderId={orderId} />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockOn.mockReturnThis()
  mockSubscribe.mockReturnThis()
  mockFetchOrderWithRetry.mockResolvedValue(null)
  vi.mocked(api.cancelOrder).mockResolvedValue({ success: true })
})

describe('ActiveOrderTracker', () => {
  it('renders PLACED state with order id', async () => {
    mockFetchOrderWithRetry.mockResolvedValue(makeOrderData('PLACED'))
    renderTracker(VALID_UUID)
    expect(await screen.findByText('PP-12345')).toBeInTheDocument()
    expect(await screen.findByText('Placed')).toBeInTheDocument()
  })

  it('renders CONFIRMED state', async () => {
    mockFetchOrderWithRetry.mockResolvedValue(makeOrderData('CONFIRMED', [
      { id: 'e1', to_state: 'CONFIRMED', created_at: '2026-04-19T10:00:00Z' },
    ]))
    renderTracker(VALID_UUID)
    expect(await screen.findByText('Confirmed')).toBeInTheDocument()
  })

  it('renders PACKED state', async () => {
    mockFetchOrderWithRetry.mockResolvedValue(makeOrderData('PACKED'))
    renderTracker(VALID_UUID)
    expect(await screen.findByText('Packed')).toBeInTheDocument()
  })

  it('renders DISPATCHED state', async () => {
    mockFetchOrderWithRetry.mockResolvedValue(makeOrderData('DISPATCHED'))
    renderTracker(VALID_UUID)
    expect(await screen.findByText('On the way')).toBeInTheDocument()
  })

  it('renders DELIVERED state', async () => {
    mockFetchOrderWithRetry.mockResolvedValue(makeOrderData('DELIVERED'))
    renderTracker(VALID_UUID)
    expect(await screen.findByText('Delivered')).toBeInTheDocument()
  })

  it('renders CANCELLED state with cancel banner', async () => {
    mockFetchOrderWithRetry.mockResolvedValue(makeOrderData('CANCELLED'))
    renderTracker(VALID_UUID)
    expect(await screen.findByText('Order Cancelled')).toBeInTheDocument()
  })

  it('shows timestamps from fulfillment events', async () => {
    mockFetchOrderWithRetry.mockResolvedValue(makeOrderData('CONFIRMED', [
      { id: 'e1', to_state: 'CONFIRMED', created_at: '2026-04-19T10:30:00Z' },
    ]))
    renderTracker(VALID_UUID)
    const timestamps = await screen.findAllByText(/\d{1,2}:\d{2}/)
    expect(timestamps.length).toBeGreaterThan(0)
  })

  it('null fetchOrder (order not found) hides Cancel button and shows degraded state', async () => {
    mockFetchOrderWithRetry.mockResolvedValue(null)
    renderTracker(VALID_UUID)
    expect(await screen.findByText(/Couldn't load this order/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cancel/i })).not.toBeInTheDocument()
  })

  it('invalid UUID hides Cancel button and shows degraded state immediately', () => {
    renderTracker('not-a-uuid')
    expect(screen.getByText(/Couldn't load this order/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cancel/i })).not.toBeInTheDocument()
  })

  it('cancels from an active tracker without bubbling to the parent card', async () => {
    const user = userEvent.setup()
    const parentClick = vi.fn()
    mockFetchOrderWithRetry
      .mockResolvedValueOnce(makeOrderData('PLACED'))
      .mockResolvedValueOnce(makeOrderData('CANCELLED'))

    render(
      <MemoryRouter>
        <div onClick={parentClick}>
          <ActiveOrderTracker orderId={VALID_UUID} />
        </div>
      </MemoryRouter>
    )

    await user.click(await screen.findByRole('button', { name: 'Cancel order' }))
    expect(parentClick).not.toHaveBeenCalled()

    await user.click(await screen.findByRole('button', { name: 'Yes, cancel' }))
    expect(api.cancelOrder).toHaveBeenCalledWith(VALID_UUID, 'Customer cancelled from app')
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['customer-orders'] })
    expect(await screen.findByText('Order Cancelled')).toBeInTheDocument()
  })

  it('keeps only one cancel confirmation open across active trackers', async () => {
    const user = userEvent.setup()
    mockFetchOrderWithRetry.mockResolvedValue(makeOrderData('PLACED'))

    render(
      <MemoryRouter>
        <ActiveOrderTracker orderId={VALID_UUID} />
        <ActiveOrderTracker orderId="223e4567-e89b-12d3-a456-426614174000" />
      </MemoryRouter>
    )

    const buttons = await screen.findAllByRole('button', { name: 'Cancel order' })
    await user.click(buttons[0])
    expect(screen.getAllByRole('button', { name: 'Yes, cancel' })).toHaveLength(1)

    await user.click(buttons[1])
    expect(screen.getAllByRole('button', { name: 'Yes, cancel' })).toHaveLength(1)
  })
})

describe('ActiveOrderTracker — retry behavior', () => {
  it('shows order when fetchOrderWithRetry eventually resolves data', async () => {
    mockFetchOrderWithRetry.mockResolvedValue(makeOrderData('PLACED'))
    renderTracker(VALID_UUID)
    expect(await screen.findByText('PP-12345')).toBeInTheDocument()
  })

  it('shows fallback when fetchOrderWithRetry returns null', async () => {
    mockFetchOrderWithRetry.mockResolvedValue(null)
    renderTracker(VALID_UUID)
    expect(await screen.findByText(/Couldn't load this order/i)).toBeInTheDocument()
  })
})
