import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReorder } from '../useReorder'

const mockNavigate = vi.fn()
const mockAddCafeItem = vi.fn()
const mockClearCafeCart = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('../../../contexts/CartContext', () => ({
  useCart: () => ({
    addCafeItem: mockAddCafeItem,
    clearCafeCart: mockClearCafeCart,
  }),
}))

vi.mock('../../ordering/OrderingContext', () => ({
  useOrdering: () => ({ storeInfo: { storeId: 'store-1' } }),
}))

const mockMenu = {
  products: [
    {
      id: 'petpooja-001',
      name: 'Espresso',
      description: null,
      price: 150,
      category_ids: ['cat-1'],
      addon_groups: [
        {
          id: 'ag-1',
          name: 'Milk',
          min_selection: 0,
          max_selection: 1,
          addons: [
            { id: 'addon-001', code: 'A001', name: 'Oat Milk', price: 30 },
          ],
        },
      ],
    },
  ],
}

const mockReorderPayload = {
  kind: 'cafe' as const,
  items: [
    {
      petpooja_item_id: 'petpooja-001',
      item_name: 'Espresso',
      quantity: 2,
      addons: [
        { petpooja_addon_id: 'addon-001', mapped_addon_id: 1, name: 'Oat Milk', price: 30 },
      ],
    },
  ],
}

const mockOrderDelivered = {
  id: 'order-1',
  source_order_id: 'src-1',
  store_name: 'GoldRush',
  status: 'delivered',
  order_type: 'dine_in',
  total_amount: 330,
  loyalty_discount_amount: 0,
  cashback_earned: 0,
  item_count: 2,
  order_date: '2026-04-01',
  updated_at: '2026-04-01',
  payment_status: 'paid',
  reorder_payload: mockReorderPayload,
  items: [],
}

let mockOrdersData: { orders: typeof mockOrderDelivered[] } | undefined = undefined
let mockMenuData: typeof mockMenu | undefined = undefined

vi.mock('../../../hooks/useCustomerProfile', () => ({
  useCustomerOrders: () => ({ data: mockOrdersData, isLoading: false }),
  useStoreMenu: () => ({ data: mockMenuData }),
}))

import { toast } from 'sonner'

beforeEach(() => {
  vi.clearAllMocks()
  mockOrdersData = undefined
  mockMenuData = undefined
})

describe('useReorder', () => {
  it('canReorder is true when there is a delivered order with payload and menu is loaded', () => {
    mockOrdersData = { orders: [mockOrderDelivered] }
    mockMenuData = mockMenu
    const { result } = renderHook(() => useReorder())
    expect(result.current.canReorder).toBe(true)
  })

  it('canReorder is false when there are no orders', () => {
    mockOrdersData = { orders: [] }
    mockMenuData = mockMenu
    const { result } = renderHook(() => useReorder())
    expect(result.current.canReorder).toBe(false)
  })

  it('canReorder is false when menu is not loaded', () => {
    mockOrdersData = { orders: [mockOrderDelivered] }
    mockMenuData = undefined
    const { result } = renderHook(() => useReorder())
    expect(result.current.canReorder).toBe(false)
  })

  it('canReorder is false when order has no reorder_payload', () => {
    mockOrdersData = { orders: [{ ...mockOrderDelivered, reorder_payload: null as never }] }
    mockMenuData = mockMenu
    const { result } = renderHook(() => useReorder())
    expect(result.current.canReorder).toBe(false)
  })

  it('reorder() clears cart, adds matched items, shows success toast, and navigates to /order', () => {
    mockOrdersData = { orders: [mockOrderDelivered] }
    mockMenuData = mockMenu
    const { result } = renderHook(() => useReorder())
    act(() => result.current.reorder())
    expect(mockClearCafeCart).toHaveBeenCalledOnce()
    expect(mockAddCafeItem).toHaveBeenCalledOnce()
    expect(mockAddCafeItem).toHaveBeenCalledWith({
      productId: 'petpooja-001',
      productCode: 'petpooja-001',
      name: 'Espresso',
      price: 150,
      quantity: 2,
      addons: [{ id: 'addon-001', name: 'Oat Milk', price: 30 }],
      specialInstructions: '',
    })
    expect(toast.success).toHaveBeenCalledWith('Added 1 items to cart.')
    expect(mockNavigate).toHaveBeenCalledWith('/order')
  })

  it('reorder() skips items not found in current menu and shows skipped count in toast', () => {
    const payloadWithUnknown = {
      kind: 'cafe' as const,
      items: [
        ...mockReorderPayload.items,
        { petpooja_item_id: 'unknown-item', item_name: 'Old Item', quantity: 1, addons: [] },
      ],
    }
    mockOrdersData = { orders: [{ ...mockOrderDelivered, reorder_payload: payloadWithUnknown }] }
    mockMenuData = mockMenu
    const { result } = renderHook(() => useReorder())
    act(() => result.current.reorder())
    expect(mockAddCafeItem).toHaveBeenCalledOnce()
    expect(toast.success).toHaveBeenCalledWith('Added 1 items to cart. 1 no longer available.')
    expect(mockNavigate).toHaveBeenCalledWith('/order')
  })

  it('reorder() shows error toast and does NOT navigate when no items match menu', () => {
    const payloadAllUnknown = {
      kind: 'cafe' as const,
      items: [
        { petpooja_item_id: 'unknown-1', item_name: 'Gone', quantity: 1, addons: [] },
      ],
    }
    mockOrdersData = { orders: [{ ...mockOrderDelivered, reorder_payload: payloadAllUnknown }] }
    mockMenuData = mockMenu
    const { result } = renderHook(() => useReorder())
    act(() => result.current.reorder())
    expect(toast.error).toHaveBeenCalledWith('No items from your last order are available right now.')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('reorder() skips missing addons but still adds the parent item', () => {
    const payloadMissingAddon = {
      kind: 'cafe' as const,
      items: [
        {
          petpooja_item_id: 'petpooja-001',
          item_name: 'Espresso',
          quantity: 1,
          addons: [
            { petpooja_addon_id: 'nonexistent-addon', mapped_addon_id: 99, name: 'Old Addon', price: 20 },
          ],
        },
      ],
    }
    mockOrdersData = { orders: [{ ...mockOrderDelivered, reorder_payload: payloadMissingAddon }] }
    mockMenuData = mockMenu
    const { result } = renderHook(() => useReorder())
    act(() => result.current.reorder())
    expect(mockAddCafeItem).toHaveBeenCalledOnce()
    expect(mockAddCafeItem).toHaveBeenCalledWith(
      expect.objectContaining({ addons: [] })
    )
    expect(mockNavigate).toHaveBeenCalledWith('/order')
  })
})
