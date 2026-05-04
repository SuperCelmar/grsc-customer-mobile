import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { api } from '../api'

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}))

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
    },
  },
}))

describe('api.cancelOrder', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'session-token' } },
    })
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true }),
    })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('omits x-source so the cancel-order CORS preflight can pass', async () => {
    await api.cancelOrder('order-1', 'Customer cancelled from app')

    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect((init?.headers as Record<string, string>)['x-source']).toBeUndefined()
  })

  it('keeps x-source on ordinary customer functions', async () => {
    await api.getCustomerOrders()

    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect((init?.headers as Record<string, string>)['x-source']).toBe('web')
  })
})
