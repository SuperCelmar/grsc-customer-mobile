import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CartDrawer } from '../CartDrawer'
import type { CafeCartItem } from '../../../contexts/CartContext'

const mockNavigate = vi.fn()
const mockOnClose = vi.fn()
const mockPlaceOrder = vi.fn()
const mockCreateCashfreeCafeOrder = vi.fn()
const mockOpenCashfree = vi.fn()
const mockToastError = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../../../hooks/useCustomerProfile', () => ({
  useCustomerProfile: () => ({
    data: {
      customer: {
        id: 'customer-1',
        phone: '9000000005',
        name: 'Test Customer',
      },
    },
  }),
}))

vi.mock('../../../lib/api', () => ({
  api: {
    placeOrder: (...args: unknown[]) => mockPlaceOrder(...args),
    createCashfreeCafeOrder: (...args: unknown[]) => mockCreateCashfreeCafeOrder(...args),
  },
}))

vi.mock('sonner', () => ({
  toast: { error: (...args: unknown[]) => mockToastError(...args) },
}))

vi.mock('../useCashfree', () => ({
  useCashfree: () => ({ open: mockOpenCashfree }),
}))

vi.mock('../useCashfreeSession', () => ({
  cartHash: () => 'hash-abc',
  loadSession: () => null,
  saveSession: vi.fn(),
  clearSessionByOrderId: vi.fn(),
}))

vi.mock('../../orders/RewardPicker', () => ({
  RewardPicker: () => null,
}))

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

let mockClearCart: ReturnType<typeof vi.fn>

vi.mock('../../../contexts/CartContext', () => ({
  useCart: () => ({
    items: [cafeItem],
    cafeCount: 1,
    cafeSubtotal: 200,
    shopCart: [],
    shopCount: 0,
    shopSubtotalPaise: 0,
    removeItem: vi.fn(),
    updateQty: vi.fn(),
    clearCart: (...args: unknown[]) => mockClearCart(...args),
    removeShopItem: vi.fn(),
    updateShopQty: vi.fn(),
    itemCount: 1,
  }),
}))

function renderDrawer() {
  return render(
    <CartDrawer
      onClose={mockOnClose}
      storeRestId="rest-001"
      storeId="store-001"
      isStoreOpen={true}
    />
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockClearCart = vi.fn()
})

describe('CartDrawer.handlePlaceOrder — COD branch', () => {
  it('calls api.placeOrder and navigates with valid UUID', async () => {
    const orderId = '123e4567-e89b-12d3-a456-426614174000'
    mockPlaceOrder.mockResolvedValue({ order_id: orderId })

    renderDrawer()
    fireEvent.click(screen.getByRole('button', { name: /Place Order/i }))

    expect(screen.getByText('Sending your order')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockPlaceOrder).toHaveBeenCalledOnce()
    })
    expect(mockCreateCashfreeCafeOrder).not.toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith(`/orders?active=${orderId}`)
    expect(mockClearCart).toHaveBeenCalledOnce()
  })

  it('navigates to /orders (no ?active) when order_id is not a valid UUID', async () => {
    mockPlaceOrder.mockResolvedValue({ order_id: 'not-a-uuid' })

    renderDrawer()
    fireEvent.click(screen.getByRole('button', { name: /Place Order/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/orders')
    })
  })
})

describe('CartDrawer.handlePlaceOrder — Online payment branch', () => {
  beforeEach(() => {
    renderDrawer()
    // Switch to ONLINE payment
    fireEvent.click(screen.getByRole('button', { name: /Online payment/i }))
  })

  it('calls openCashfree then navigate on success', async () => {
    const orderId = '123e4567-e89b-12d3-a456-426614174000'
    mockCreateCashfreeCafeOrder.mockResolvedValue({
      order_id: orderId,
      payment_session_id: 'cf_sess_1',
    })
    mockOpenCashfree.mockImplementation(async (opts: { onSuccess: (id: string) => void }) => {
      opts.onSuccess(orderId)
    })

    fireEvent.click(screen.getByRole('button', { name: /Place Order/i }))

    await waitFor(() => {
      expect(mockOpenCashfree).toHaveBeenCalledOnce()
    })
    expect(mockPlaceOrder).not.toHaveBeenCalled()
    expect(mockCreateCashfreeCafeOrder).toHaveBeenCalledOnce()
    expect(mockNavigate).toHaveBeenCalledWith(`/orders?active=${orderId}`)
    expect(mockClearCart).toHaveBeenCalledOnce()
  })

  it('calls toast.error and does NOT navigate on Cashfree session creation failure', async () => {
    mockCreateCashfreeCafeOrder.mockRejectedValue(new Error('Network error'))

    fireEvent.click(screen.getByRole('button', { name: /Place Order/i }))

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Network error')
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('calls toast.error and does NOT navigate on Cashfree payment failure callback', async () => {
    mockCreateCashfreeCafeOrder.mockResolvedValue({
      order_id: 'ord-1',
      payment_session_id: 'cf_sess_2',
    })
    mockOpenCashfree.mockImplementation(async (opts: { onFailure: (msg: string) => void }) => {
      opts.onFailure('Card declined')
    })

    fireEvent.click(screen.getByRole('button', { name: /Place Order/i }))

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Card declined')
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
