import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UnifiedCheckoutScreen } from '../UnifiedCheckoutScreen'
import type { CafeCartItem, ShopCartItem } from '../../../contexts/CartContext'

// ── Router ───────────────────────────────────────────────────────────────────
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ key: 'test-key' }),
}))

// ── React Query ──────────────────────────────────────────────────────────────
const mockInvalidateQueries = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [mockAddress], isLoading: false }),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}))

// ── API ───────────────────────────────────────────────────────────────────────
const mockCreateOnlineOrder = vi.fn()
const mockVerifyRazorpayPayment = vi.fn()
const mockPlaceOrder = vi.fn()
const mockCreateCashfreeCafeOrder = vi.fn()

vi.mock('../../../lib/api', () => ({
  api: {
    createOnlineOrder: (...args: any[]) => mockCreateOnlineOrder(...args),
    verifyRazorpayPayment: (...args: any[]) => mockVerifyRazorpayPayment(...args),
    placeOrder: (...args: any[]) => mockPlaceOrder(...args),
    createCashfreeCafeOrder: (...args: any[]) => mockCreateCashfreeCafeOrder(...args),
    listAddresses: vi.fn(),
  },
}))

// ── useRazorpay ───────────────────────────────────────────────────────────────
const mockRazorpayOpen = vi.fn()
vi.mock('../useRazorpay', () => ({
  useRazorpay: () => ({ open: mockRazorpayOpen, loading: false, error: null }),
}))

// ── useCashfree ───────────────────────────────────────────────────────────────
const mockCashfreeOpen = vi.fn()
vi.mock('../useCashfree', () => ({
  useCashfree: () => ({ open: mockCashfreeOpen, loading: false, error: null }),
}))

// ── Customer profile / store status (factory — lets tests override storeOpen) ─
let mockStoreOpen = true
vi.mock('../../../hooks/useCustomerProfile', () => ({
  useCustomerProfile: () => ({
    data: { customer: { phone: '9999999999', name: 'Test User' } },
  }),
  useStoreStatus: () => ({
    data: { store_status: mockStoreOpen ? '1' : '0' },
  }),
}))

// ── OrderingContext ──────────────────────────────────────────────────────────
vi.mock('../OrderingContext', () => ({
  useOrdering: () => ({
    storeInfo: {
      storeId: 'store-1',
      storeName: 'GoldRush',
      petpoojaRestaurantId: 'rest-001',
    },
  }),
}))

// ── AddressBottomSheet (not under test) ──────────────────────────────────────
vi.mock('../AddressBottomSheet', () => ({
  AddressBottomSheet: () => null,
}))

// ── lucide-react ─────────────────────────────────────────────────────────────
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span>Back</span>,
  ChevronLeft: () => <span>ChevronLeft</span>,
  User: () => <span>User</span>,
  ShoppingBag: () => <span>ShoppingBag</span>,
}))

// ── Shared fixtures ──────────────────────────────────────────────────────────
const mockAddress = {
  address_id: 'addr-1',
  label: 'Home',
  line1: '123 Main St',
  line2: '',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500001',
  is_default: true,
}

const cafeItem: CafeCartItem = {
  cartItemId: 'ci-1',
  productId: 'p-1',
  productCode: 'LAT-001',
  name: 'Latte',
  price: 200,
  quantity: 1,
  addons: [],
  specialInstructions: '',
}

const shopItem: ShopCartItem = {
  variantId: 'v-1',
  productId: 'prod-1',
  productName: 'Bolt Blend',
  variantName: 'Whole Bean 250g',
  pricePaise: 140000,
  imageUrl: null,
  quantity: 1,
  subscription: null,
}

// ── Cart mock ────────────────────────────────────────────────────────────────
const mockClearCafeCart = vi.fn()
const mockClearShopCart = vi.fn()

let mockCartState = {
  items: [cafeItem] as CafeCartItem[],
  cafeCount: 1,
  cafeSubtotal: 200,
  shopCart: [shopItem] as ShopCartItem[],
  shopCount: 1,
  shopSubtotalPaise: 140000,
  clearCafeCart: mockClearCafeCart,
  clearShopCart: mockClearShopCart,
}

vi.mock('../../../contexts/CartContext', () => ({
  useCart: () => mockCartState,
}))

// ── Test helpers ─────────────────────────────────────────────────────────────

function setupRazorpaySuccess(shopOrderId = '11111111-1111-1111-1111-111111111111') {
  mockCreateOnlineOrder.mockResolvedValue({
    razorpay_key_id: 'rzp_test_key',
    razorpay_order_id: 'rzp_order_1',
    amount_paise: 140000,
  })
  mockVerifyRazorpayPayment.mockResolvedValue({
    status: 'paid',
    order_id: shopOrderId,
  })
  mockRazorpayOpen.mockImplementation(async (opts: any) => {
    await opts.handler({
      razorpay_order_id: 'rzp_order_1',
      razorpay_payment_id: 'pay_mock',
      razorpay_signature: 'sig_mock',
    })
  })
}

function renderScreen() {
  return render(<UnifiedCheckoutScreen />)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockStoreOpen = true
  mockCartState = {
    items: [cafeItem],
    cafeCount: 1,
    cafeSubtotal: 200,
    shopCart: [shopItem],
    shopCount: 1,
    shopSubtotalPaise: 140000,
    clearCafeCart: mockClearCafeCart,
    clearShopCart: mockClearShopCart,
  }
})

// ─────────────────────────────────────────────────────────────────────────────
describe('UnifiedCheckoutScreen — happy path', () => {
  it('clears both carts and navigates with both order IDs on full success (ONLINE cafe via Cashfree)', async () => {
    setupRazorpaySuccess('11111111-1111-1111-1111-111111111111')
    // ONLINE cafe portion goes through Cashfree, not external-order.
    mockCreateCashfreeCafeOrder.mockResolvedValue({
      order_id: '22222222-2222-2222-2222-222222222222',
      payment_session_id: 'cf_sess_mock',
    })
    mockCashfreeOpen.mockImplementation(async (opts: any) => {
      opts.onSuccess('22222222-2222-2222-2222-222222222222')
    })

    renderScreen()

    fireEvent.click(screen.getByRole('button', { name: /Pay/i }))

    await waitFor(() => {
      expect(mockClearCafeCart).toHaveBeenCalledOnce()
      expect(mockClearShopCart).toHaveBeenCalledOnce()
    })

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['customer-orders'] })
    // Cafe (22222...) is primary; shop (11111...) is secondary chip
    expect(mockNavigate).toHaveBeenCalledWith(
      '/order-confirmation/22222222-2222-2222-2222-222222222222?secondary=11111111-1111-1111-1111-111111111111'
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('UnifiedCheckoutScreen — partial failure', () => {
  it('clears shop cart, preserves cafe cart, shows banner with shop id, navigates with shop id only (cafe payment failure)', async () => {
    setupRazorpaySuccess('11111111-1111-1111-1111-111111111111')
    // Shop paid; cafe Cashfree session creation fails.
    mockCreateCashfreeCafeOrder.mockRejectedValue(new Error('Cafe payment failed'))

    renderScreen()

    fireEvent.click(screen.getByRole('button', { name: /Pay/i }))

    await waitFor(() => {
      expect(mockClearShopCart).toHaveBeenCalledOnce()
    })

    expect(mockClearCafeCart).not.toHaveBeenCalled()

    expect(await screen.findByText(/Shop paid.*Cafe payment failed/i)).toBeInTheDocument()

    // Shop-only success navigates to confirmation with shop id as primary
    expect(mockNavigate).toHaveBeenCalledWith('/order-confirmation/11111111-1111-1111-1111-111111111111')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('UnifiedCheckoutScreen — Razorpay cancel', () => {
  it('shows "Payment not completed" banner, keeps both carts intact, stays on page', async () => {
    mockCreateOnlineOrder.mockResolvedValue({
      razorpay_key_id: 'rzp_test_key',
      razorpay_order_id: 'rzp_order_1',
      amount_paise: 140000,
    })
    // Simulate user dismissing Razorpay modal via ondismiss
    mockRazorpayOpen.mockImplementation(async (opts: any) => {
      await opts.ondismiss()
    })

    renderScreen()

    fireEvent.click(screen.getByRole('button', { name: /Pay/i }))

    await waitFor(() => {
      expect(screen.getByText(/Payment not completed/i)).toBeInTheDocument()
    })

    expect(mockClearCafeCart).not.toHaveBeenCalled()
    expect(mockClearShopCart).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('UnifiedCheckoutScreen — store closed', () => {
  it('renders closed-store banner and Pay button is aria-disabled with missing-field hint', () => {
    mockStoreOpen = false

    renderScreen()

    expect(
      screen.getByText(/Cafe is currently closed/i)
    ).toBeInTheDocument()

    const payBtn = screen.getByRole('button', { name: /Pay/i })
    expect(payBtn).toHaveAttribute('aria-disabled', 'true')
    expect(
      screen.getByText(/Cafe is closed — remove cafe items/i)
    ).toBeInTheDocument()
  })
})
