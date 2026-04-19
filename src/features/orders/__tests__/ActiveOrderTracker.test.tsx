import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActiveOrderTracker } from '../ActiveOrderTracker'

const mockUnsubscribe = vi.fn()
const mockSubscribe = vi.fn().mockReturnThis()
const mockOn = vi.fn().mockReturnThis()
const mockChannel = { on: mockOn, subscribe: mockSubscribe, unsubscribe: mockUnsubscribe }

// Keep a reference the factory can close over without the hoisting issue
let resolvedData: object | null = null

vi.mock('../../../lib/supabase', () => {
  const mockMaybeSingle = vi.fn().mockImplementation(() => Promise.resolve({ data: resolvedData, error: null }))
  const mockOrder = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
  const mockEq = vi.fn().mockReturnValue({ order: mockOrder, maybeSingle: mockMaybeSingle })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
  return {
    supabase: {
      from: mockFrom,
      channel: vi.fn(() => mockChannel),
    },
  }
})

function setOrderState(fulfillment_status: string, events: object[] = []) {
  resolvedData = {
    fulfillment_status,
    source_order_id: 'PP-12345',
    order_fulfillment_events: events,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockOn.mockReturnThis()
  mockSubscribe.mockReturnThis()
  resolvedData = null
})

describe('ActiveOrderTracker', () => {
  it('renders PLACED state with order id', async () => {
    setOrderState('PLACED')
    render(<ActiveOrderTracker orderId="order-uuid-1" />)
    expect(await screen.findByText('PP-12345')).toBeInTheDocument()
    expect(await screen.findByText('Placed')).toBeInTheDocument()
  })

  it('renders CONFIRMED state', async () => {
    setOrderState('CONFIRMED', [
      { id: 'e1', to_state: 'CONFIRMED', created_at: '2026-04-19T10:00:00Z' },
    ])
    render(<ActiveOrderTracker orderId="order-uuid-2" />)
    expect(await screen.findByText('Confirmed')).toBeInTheDocument()
  })

  it('renders PACKED state', async () => {
    setOrderState('PACKED')
    render(<ActiveOrderTracker orderId="order-uuid-3" />)
    expect(await screen.findByText('Packed')).toBeInTheDocument()
  })

  it('renders DISPATCHED state', async () => {
    setOrderState('DISPATCHED')
    render(<ActiveOrderTracker orderId="order-uuid-4" />)
    expect(await screen.findByText('On the way')).toBeInTheDocument()
  })

  it('renders DELIVERED state', async () => {
    setOrderState('DELIVERED')
    render(<ActiveOrderTracker orderId="order-uuid-5" />)
    expect(await screen.findByText('Delivered')).toBeInTheDocument()
  })

  it('renders CANCELLED state with cancel banner', async () => {
    setOrderState('CANCELLED')
    render(<ActiveOrderTracker orderId="order-uuid-6" />)
    expect(await screen.findByText('Order Cancelled')).toBeInTheDocument()
  })

  it('shows timestamps from fulfillment events', async () => {
    setOrderState('CONFIRMED', [
      { id: 'e1', to_state: 'CONFIRMED', created_at: '2026-04-19T10:30:00Z' },
    ])
    render(<ActiveOrderTracker orderId="order-uuid-7" />)
    const timestamps = await screen.findAllByText(/\d{1,2}:\d{2}/)
    expect(timestamps.length).toBeGreaterThan(0)
  })
})
