import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCashfree } from '../useCashfree'

type CheckoutResult = { error?: { message: string }; redirect?: boolean }

function stubCashfree(checkoutResult: CheckoutResult) {
  const checkout = vi.fn().mockResolvedValue(checkoutResult)
  ;(window as any).Cashfree = vi.fn(() => ({ checkout }))
  return checkout
}

beforeEach(() => {
  delete (window as any).Cashfree
})

afterEach(() => {
  delete (window as any).Cashfree
})

describe('useCashfree — real SDK path (dev short-circuit removed)', () => {
  it('opens the SDK with the payment_session_id and calls onSuccess on success', async () => {
    const checkout = stubCashfree({})
    const onSuccess = vi.fn()
    const onFailure = vi.fn()

    const { result } = renderHook(() => useCashfree())

    await act(async () => {
      await result.current.open({
        payment_session_id: 'cf_session_test',
        order_id: 'test-order-123',
        onSuccess,
        onFailure,
      })
    })

    expect(checkout).toHaveBeenCalledWith({
      paymentSessionId: 'cf_session_test',
      redirectTarget: '_modal',
    })
    expect(onSuccess).toHaveBeenCalledWith('test-order-123')
    expect(onFailure).not.toHaveBeenCalled()
  })

  it('calls onFailure when checkout returns an error', async () => {
    stubCashfree({ error: { message: 'card declined' } })
    const onSuccess = vi.fn()
    const onFailure = vi.fn()

    const { result } = renderHook(() => useCashfree())

    await act(async () => {
      await result.current.open({
        payment_session_id: 'cf_session_test',
        order_id: 'order-456',
        onSuccess,
        onFailure,
      })
    })

    expect(onFailure).toHaveBeenCalledWith('card declined')
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('returns loading=false after completion', async () => {
    stubCashfree({})

    const { result } = renderHook(() => useCashfree())

    await act(async () => {
      await result.current.open({
        payment_session_id: 'cf_session_test',
        order_id: 'order-456',
        onSuccess: vi.fn(),
        onFailure: vi.fn(),
      })
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })
})
