import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockInvoke = vi.fn()

vi.mock('../../../lib/supabase', () => {
  return {
    supabase: {
      functions: {
        invoke: (...args: unknown[]) => mockInvoke(...args),
      },
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

const NOT_FOUND_ERROR = { context: { status: 404 } }

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('fetchOrderWithRetry', () => {
  it('returns data immediately on first successful fetch', async () => {
    mockInvoke.mockResolvedValue({ data: ORDER_ROW, error: null })
    const promise = fetchOrderWithRetry('some-uuid')
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result).toEqual(ORDER_ROW)
    expect(mockInvoke).toHaveBeenCalledTimes(1)
  })

  it('retries after 404 and returns data on second attempt', async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: NOT_FOUND_ERROR })
      .mockResolvedValueOnce({ data: ORDER_ROW, error: null })

    const promise = fetchOrderWithRetry('some-uuid')
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result).toEqual(ORDER_ROW)
    expect(mockInvoke).toHaveBeenCalledTimes(2)
  })

  it('retries after two 404s and returns data on third attempt', async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: NOT_FOUND_ERROR })
      .mockResolvedValueOnce({ data: null, error: NOT_FOUND_ERROR })
      .mockResolvedValueOnce({ data: ORDER_ROW, error: null })

    const promise = fetchOrderWithRetry('some-uuid')
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result).toEqual(ORDER_ROW)
    expect(mockInvoke).toHaveBeenCalledTimes(3)
  })

  it('returns null after all 4 attempts return 404', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: NOT_FOUND_ERROR })

    const promise = fetchOrderWithRetry('some-uuid')
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result).toBeNull()
    expect(mockInvoke).toHaveBeenCalledTimes(4)
  })

  it('returns null immediately on non-404 error (terminal)', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { context: { status: 500 } } })

    const promise = fetchOrderWithRetry('some-uuid')
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result).toBeNull()
    expect(mockInvoke).toHaveBeenCalledTimes(1)
  })

  it('retries on null data with no error (safety case)', async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: ORDER_ROW, error: null })

    const promise = fetchOrderWithRetry('some-uuid')
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result).toEqual(ORDER_ROW)
    expect(mockInvoke).toHaveBeenCalledTimes(2)
  })
})
