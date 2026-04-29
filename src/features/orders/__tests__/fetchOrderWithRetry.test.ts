import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockMaybeSingle = vi.fn()

vi.mock('../../../lib/supabase', () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: (...args: unknown[]) => mockMaybeSingle(...args),
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.order.mockReturnValue(chain)
  return {
    supabase: {
      from: vi.fn(() => chain),
    },
  }
})

import { fetchOrderWithRetry } from '../lib/fetchOrderWithRetry'

const ORDER_ROW = {
  fulfillment_status: 'PLACED',
  source_order_id: 'PP-999',
  payment_status: null,
  order_fulfillment_events: [],
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('fetchOrderWithRetry', () => {
  it('returns data immediately on first successful fetch', async () => {
    mockMaybeSingle.mockResolvedValue({ data: ORDER_ROW, error: null })
    const promise = fetchOrderWithRetry('some-uuid')
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result).toEqual(ORDER_ROW)
    expect(mockMaybeSingle).toHaveBeenCalledTimes(1)
  })

  it('retries after null and returns data on second attempt', async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: ORDER_ROW, error: null })

    const promise = fetchOrderWithRetry('some-uuid')
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result).toEqual(ORDER_ROW)
    expect(mockMaybeSingle).toHaveBeenCalledTimes(2)
  })

  it('retries after two nulls and returns data on third attempt', async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: ORDER_ROW, error: null })

    const promise = fetchOrderWithRetry('some-uuid')
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result).toEqual(ORDER_ROW)
    expect(mockMaybeSingle).toHaveBeenCalledTimes(3)
  })

  it('returns null after all 4 attempts return null', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const promise = fetchOrderWithRetry('some-uuid')
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result).toBeNull()
    expect(mockMaybeSingle).toHaveBeenCalledTimes(4)
  })
})
