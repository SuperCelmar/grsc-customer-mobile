import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CartDrawer } from '../CartDrawer'
import type { CafeCartItem, ShopCartItem } from '../../../contexts/CartContext'

const mockNavigate = vi.fn()
const mockOnClose = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../../../hooks/useCustomerProfile', () => ({
  useCustomerProfile: () => ({ data: null }),
}))

vi.mock('../../../lib/api', () => ({
  api: {
    placeOrder: vi.fn(),
  },
}))

const cafeItemA: CafeCartItem = {
  cartItemId: 'ci-a',
  productId: 'p-a',
  productCode: 'LAT-001',
  name: 'Latte',
  price: 200,
  quantity: 1,
  addons: [],
  specialInstructions: '',
}

const shopItemB: ShopCartItem = {
  variantId: 'v-b',
  productId: 'prod-b',
  productName: 'Bolt Blend',
  variantName: 'Whole Bean 250g',
  pricePaise: 140000,
  imageUrl: null,
  quantity: 1,
  subscription: null,
}

const shopItemC: ShopCartItem = {
  variantId: 'v-c',
  productId: 'prod-c',
  productName: 'Cold Brew',
  variantName: 'Can 330ml',
  pricePaise: 8000,
  imageUrl: null,
  quantity: 1,
  subscription: null,
}

// Default cart state — overridden per test
let mockCartState = {
  items: [] as CafeCartItem[],
  cafeCount: 0,
  cafeSubtotal: 0,
  shopCart: [] as ShopCartItem[],
  shopCount: 0,
  shopSubtotalPaise: 0,
  removeItem: vi.fn(),
  updateQty: vi.fn(),
  clearCart: vi.fn(),
  removeShopItem: vi.fn(),
  updateShopQty: vi.fn(),
  itemCount: 0,
}

vi.mock('../../../contexts/CartContext', () => ({
  useCart: () => mockCartState,
}))

function renderDrawer(props: Partial<Parameters<typeof CartDrawer>[0]> = {}) {
  return render(
    <CartDrawer
      onClose={mockOnClose}
      storeRestId="rest-001"
      storeId="store-001"
      isStoreOpen={true}
      {...props}
    />
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCartState = {
    items: [],
    cafeCount: 0,
    cafeSubtotal: 0,
    shopCart: [],
    shopCount: 0,
    shopSubtotalPaise: 0,
    removeItem: vi.fn(),
    updateQty: vi.fn(),
    clearCart: vi.fn(),
    removeShopItem: vi.fn(),
    updateShopQty: vi.fn(),
    itemCount: 0,
  }
})

describe('CartDrawer — combined item list', () => {
  it('renders all 3 rows with correct type pills for 1 cafe + 2 shop items', () => {
    mockCartState = {
      ...mockCartState,
      items: [cafeItemA],
      cafeCount: 1,
      cafeSubtotal: 200,
      shopCart: [shopItemB, shopItemC],
      shopCount: 2,
      shopSubtotalPaise: 148000,
      itemCount: 1,
    }

    renderDrawer()

    // Cafe item row
    expect(screen.getByText('Latte')).toBeInTheDocument()
    // Shop item rows
    expect(screen.getByText('Bolt Blend')).toBeInTheDocument()
    expect(screen.getByText('Cold Brew')).toBeInTheDocument()

    // TypePill renders exact text "🥤 Pickup" and "📦 Ship"
    // Use exact match to avoid matching "Pickup subtotal" / "Shipped subtotal" in totals
    const pickupPills = screen.getAllByText('🥤 Pickup')
    expect(pickupPills).toHaveLength(1)

    const shipPills = screen.getAllByText('📦 Ship')
    expect(shipPills).toHaveLength(2)
  })
})

describe('CartDrawer — CTA label', () => {
  it('shows "Place Order" for cafe-only', () => {
    mockCartState = {
      ...mockCartState,
      items: [cafeItemA],
      cafeCount: 1,
      cafeSubtotal: 200,
      itemCount: 1,
    }

    renderDrawer()
    expect(screen.getByRole('button', { name: /Place Order/i })).toBeInTheDocument()
  })

  it('shows "Proceed to Pay" for shop-only', () => {
    mockCartState = {
      ...mockCartState,
      shopCart: [shopItemB],
      shopCount: 1,
      shopSubtotalPaise: 140000,
    }

    renderDrawer()
    expect(screen.getByRole('button', { name: /Proceed to Pay/i })).toBeInTheDocument()
  })

  it('shows "Checkout" for mixed cart', () => {
    mockCartState = {
      ...mockCartState,
      items: [cafeItemA],
      cafeCount: 1,
      cafeSubtotal: 200,
      shopCart: [shopItemB],
      shopCount: 1,
      shopSubtotalPaise: 140000,
      itemCount: 1,
    }

    renderDrawer()
    expect(screen.getByRole('button', { name: /Checkout/i })).toBeInTheDocument()
  })
})

describe('CartDrawer — CTA navigation', () => {
  it('mixed CTA click calls onClose then navigate("/checkout")', () => {
    mockCartState = {
      ...mockCartState,
      items: [cafeItemA],
      cafeCount: 1,
      cafeSubtotal: 200,
      shopCart: [shopItemB],
      shopCount: 1,
      shopSubtotalPaise: 140000,
      itemCount: 1,
    }

    renderDrawer()
    fireEvent.click(screen.getByRole('button', { name: /Checkout/i }))

    expect(mockOnClose).toHaveBeenCalledOnce()
    expect(mockNavigate).toHaveBeenCalledWith('/checkout')
  })

  it('shop-only CTA click navigates to "/checkout/shop"', () => {
    mockCartState = {
      ...mockCartState,
      shopCart: [shopItemB],
      shopCount: 1,
      shopSubtotalPaise: 140000,
    }

    renderDrawer()
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Pay/i }))

    expect(mockOnClose).toHaveBeenCalledOnce()
    expect(mockNavigate).toHaveBeenCalledWith('/checkout/shop')
  })
})

describe('CartDrawer — totals display', () => {
  it('mixed mode shows both Pickup subtotal and Shipped subtotal, and grand total has "+" suffix', () => {
    mockCartState = {
      ...mockCartState,
      items: [cafeItemA],
      cafeCount: 1,
      cafeSubtotal: 200,
      shopCart: [shopItemB],
      shopCount: 1,
      shopSubtotalPaise: 140000,
      itemCount: 1,
    }

    renderDrawer()

    expect(screen.getByText('Pickup subtotal')).toBeInTheDocument()
    expect(screen.getByText('Shipped subtotal')).toBeInTheDocument()

    // Grand total cell should have "+" suffix
    const totalNowLabel = screen.getByText('Total now')
    const totalRow = totalNowLabel.closest('div')
    expect(totalRow?.textContent).toMatch(/\+/)
  })
})
