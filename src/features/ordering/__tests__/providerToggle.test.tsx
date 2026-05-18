import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { CafeCartItem, ShopCartItem } from '../../../contexts/CartContext'

// ── Router ───────────────────────────────────────────────────────────────────
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ key: 'test-key' }),
}))

// ── React Query ──────────────────────────────────────────────────────────────
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

// ── API ───────────────────────────────────────────────────────────────────────
vi.mock('../../../lib/api', () => ({
  api: {
    createOnlineOrder: vi.fn(),
    createCashfreeOrder: vi.fn(),
    verifyRazorpayPayment: vi.fn(),
    placeOrder: vi.fn(),
  },
}))

// ── useRazorpay ───────────────────────────────────────────────────────────────
vi.mock('../useRazorpay', () => ({
  useRazorpay: () => ({ open: vi.fn(), loading: false, error: null }),
}))

// ── useCashfree ───────────────────────────────────────────────────────────────
vi.mock('../useCashfree', () => ({
  useCashfree: () => ({ open: vi.fn(), loading: false, error: null }),
}))

// ── Customer profile / store status ─────────────────────────────────────────
vi.mock('../../../hooks/useCustomerProfile', () => ({
  useCustomerProfile: () => ({
    data: {
      customer: {
        id: 'cust-1',
        phone: '9999999999',
        name: 'Test User',
        address_line1: '123 Main St',
        address_line2: null,
        city: 'Hyderabad',
        state: 'Telangana',
        zip_code: '500001',
      },
    },
  }),
  useStoreStatus: () => ({ data: { store_status: '1' } }),
  useAvailableRewards: () => ({ data: { rewards: [] }, isLoading: false }),
}))

// ── OrderingContext ──────────────────────────────────────────────────────────
vi.mock('../OrderingContext', () => ({
  useOrdering: () => ({ storeInfo: { storeId: 'store-1', storeName: 'GoldRush', petpoojaRestaurantId: 'rest-001' } }),
}))

// ── lucide-react ─────────────────────────────────────────────────────────────
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span>Back</span>,
  ChevronLeft: () => <span>ChevronLeft</span>,
  User: () => <span>User</span>,
  ShoppingBag: () => <span>ShoppingBag</span>,
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────
const cafeItem: CafeCartItem = {
  cartItemId: 'ci-1', productId: 'p-1', productCode: 'LAT-001',
  name: 'Latte', price: 200, quantity: 1, addons: [], specialInstructions: '',
}

const shopItem: ShopCartItem = {
  variantId: 'v-1', productId: 'prod-1', productName: 'Bolt Blend',
  variantName: 'Whole Bean 250g', pricePaise: 140000, imageUrl: null, quantity: 1, subscription: null,
}

vi.mock('../../../contexts/CartContext', () => ({
  useCart: () => ({
    items: [cafeItem], cafeCount: 1, cafeSubtotal: 200,
    shopCart: [shopItem], shopCount: 1, shopSubtotalPaise: 140000,
    clearCafeCart: vi.fn(), clearShopCart: vi.fn(),
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

// The provider toggle is gated on `enabledProviders.length > 1`, which is a
// module-level constant derived from VITE_PAYMENT_PROVIDERS at import time.
// We test both states by mocking the UnifiedCheckoutScreen module directly.

describe('UnifiedCheckoutScreen — provider toggle hidden (single provider)', () => {
  it('does not show provider buttons when only razorpay is enabled', async () => {
    // Default env has only razorpay — import the real module
    const { UnifiedCheckoutScreen } = await import('../UnifiedCheckoutScreen')
    render(<UnifiedCheckoutScreen />)
    expect(screen.queryByTestId('provider-razorpay')).toBeNull()
    expect(screen.queryByTestId('provider-cashfree')).toBeNull()
  })
})

describe('UnifiedCheckoutScreen — provider toggle visible (two providers)', () => {
  it('renders both provider buttons when VITE_PAYMENT_PROVIDERS=razorpay,cashfree', async () => {
    // Stub env before re-importing so module-level constants pick it up
    vi.resetModules()
    vi.stubEnv('VITE_PAYMENT_PROVIDERS', 'razorpay,cashfree')
    vi.stubEnv('VITE_DEFAULT_PAYMENT_PROVIDER', 'razorpay')

    // Re-mock all deps after resetModules
    vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn(), useLocation: () => ({ key: 'test-key' }) }))
    vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }))
    vi.mock('../../../lib/api', () => ({ api: { createOnlineOrder: vi.fn(), createCashfreeOrder: vi.fn(), verifyRazorpayPayment: vi.fn(), placeOrder: vi.fn() } }))
    vi.mock('../useRazorpay', () => ({ useRazorpay: () => ({ open: vi.fn(), loading: false, error: null }) }))
    vi.mock('../useCashfree', () => ({ useCashfree: () => ({ open: vi.fn(), loading: false, error: null }) }))
    vi.mock('../../../hooks/useCustomerProfile', () => ({
      useCustomerProfile: () => ({
        data: {
          customer: {
            id: 'cust-1',
            phone: '9999999999',
            name: 'Test',
            address_line1: '123 Main St',
            address_line2: null,
            city: 'Hyderabad',
            state: 'Telangana',
            zip_code: '500001',
          },
        },
      }),
      useStoreStatus: () => ({ data: { store_status: '1' } }),
      useAvailableRewards: () => ({ data: { rewards: [] }, isLoading: false }),
    }))
    vi.mock('../OrderingContext', () => ({ useOrdering: () => ({ storeInfo: { storeId: 's', storeName: 'G', petpoojaRestaurantId: 'r' } }) }))
    vi.mock('../../../contexts/CartContext', () => ({ useCart: () => ({ items: [cafeItem], cafeCount: 1, cafeSubtotal: 200, shopCart: [shopItem], shopCount: 1, shopSubtotalPaise: 140000, clearCafeCart: vi.fn(), clearShopCart: vi.fn() }) }))
    vi.mock('lucide-react', () => ({ ArrowLeft: () => <span>Back</span>, ChevronLeft: () => <span>C</span>, User: () => <span>U</span>, ShoppingBag: () => <span>S</span> }))

    const { UnifiedCheckoutScreen } = await import('../UnifiedCheckoutScreen')
    render(<UnifiedCheckoutScreen />)

    expect(screen.getByTestId('provider-razorpay')).toBeInTheDocument()
    expect(screen.getByTestId('provider-cashfree')).toBeInTheDocument()

    vi.unstubAllEnvs()
  })
})
