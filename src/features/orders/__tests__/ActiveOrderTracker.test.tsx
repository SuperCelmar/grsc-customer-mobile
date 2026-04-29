import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ActiveOrderTracker } from '../ActiveOrderTracker'

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
