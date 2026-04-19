import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCashfree } from '../useCashfree'

// Force DEV mock mode
vi.stubEnv('DEV', true)

beforeEach(() => {
  sessionStorage.setItem('grsc_dev_session', '1')
})

describe('useCashfree — dev mock mode', () => {
  it('calls onSuccess with order_id in dev mock mode', async () => {
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

    expect(onSuccess).toHaveBeenCalledWith('test-order-123')
    expect(onFailure).not.toHaveBeenCalled()
  })

  it('returns loading=false after completion', async () => {
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
