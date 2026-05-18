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

describe('api.placeOrder', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'session-token' } },
    })
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        order_id: '123e4567-e89b-12d3-a456-426614174000',
        source_order_id: '17160000000001234',
        inbox_id: 42,
        status: 'queued',
      }),
    })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('routes cafe COD placement through online-order-create with the cafe COD discriminator', async () => {
    await api.placeOrder({
      customer: { phone: '9000000005', name: 'Test Customer' },
      order: {
        restID: 'rest-001',
        order_type: 'P',
        payment_type: 'COD',
        total: 218,
        tax_total: 18,
        discount_total: 0,
      },
      items: [{
        id: 'product-1',
        name: 'Latte',
        quantity: 1,
        price: 200,
        tax_percentage: 18,
        addons: [],
      }],
    })

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/functions/v1/online-order-create')
    expect(JSON.parse(String(init?.body))).toEqual({
      order_type: 'cafe',
      payment_flow: 'cod',
      customer: { phone: '9000000005', name: 'Test Customer' },
      order: {
        restID: 'rest-001',
        order_type: 'P',
        payment_type: 'COD',
        total: 218,
        tax_total: 18,
        discount_total: 0,
      },
      items: [{
        id: 'product-1',
        name: 'Latte',
        quantity: 1,
        price: 200,
        tax_percentage: 18,
        addons: [],
      }],
    })
  })
})
