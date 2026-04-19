import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { CartProvider, useCart } from '../CartContext'

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>

const cafeItem = {
  cartItemId: 'ci-1', productId: 'p-1', productCode: 'COF-LAT', name: 'Latte',
  price: 220, quantity: 1, addons: [], specialInstructions: '',
}

const shopItem = {
  variantId: 'v-1', productId: 'prod-1', productName: 'Bolt Blend', variantName: 'Whole Bean',
  pricePaise: 140000, imageUrl: null, quantity: 1, subscription: null,
}

describe('CartContext — dual carts', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('cafe and shop carts are independent', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addCafeItem(cafeItem))
    expect(result.current.cafeCart).toHaveLength(1)
    expect(result.current.shopCart).toHaveLength(0)

    act(() => result.current.addShopItem(shopItem))
    expect(result.current.cafeCart).toHaveLength(1) // unchanged
    expect(result.current.shopCart).toHaveLength(1)
  })

  it('cartCount returns combined', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.addCafeItem({ ...cafeItem, quantity: 2 })
      result.current.addShopItem({ ...shopItem, quantity: 3 })
    })
    expect(result.current.cartCount).toBe(5)
    expect(result.current.cafeCount).toBe(2)
    expect(result.current.shopCount).toBe(3)
  })

  it('clearCafeCart only clears cafe', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.addCafeItem(cafeItem)
      result.current.addShopItem(shopItem)
    })
    act(() => result.current.clearCafeCart())
    expect(result.current.cafeCart).toHaveLength(0)
    expect(result.current.shopCart).toHaveLength(1)
  })

  it('clearShopCart only clears shop', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.addCafeItem(cafeItem)
      result.current.addShopItem(shopItem)
    })
    act(() => result.current.clearShopCart())
    expect(result.current.shopCart).toHaveLength(0)
    expect(result.current.cafeCart).toHaveLength(1)
  })

  it('cafeSubtotal and shopSubtotalPaise compute correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.addCafeItem({ ...cafeItem, price: 100, quantity: 2 })
      result.current.addShopItem({ ...shopItem, pricePaise: 50000, quantity: 3 })
    })
    expect(result.current.cafeSubtotal).toBe(200)
    expect(result.current.shopSubtotalPaise).toBe(150000)
  })

  it('persists to localStorage', () => {
    const { result, unmount } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.addCafeItem(cafeItem)
      result.current.addShopItem(shopItem)
    })
    unmount()

    // Re-render: state should be restored from localStorage
    const { result: result2 } = renderHook(() => useCart(), { wrapper })
    expect(result2.current.cafeCart).toHaveLength(1)
    expect(result2.current.shopCart).toHaveLength(1)
  })

  it('updateShopQty removes item when qty <= 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addShopItem(shopItem))
    act(() => result.current.updateShopQty('v-1', 0))
    expect(result.current.shopCart).toHaveLength(0)
  })

  it('adding same cafe item twice creates two separate cart lines', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.addCafeItem({ ...cafeItem, cartItemId: 'ci-a' })
      result.current.addCafeItem({ ...cafeItem, cartItemId: 'ci-b' })
    })
    expect(result.current.cafeCart).toHaveLength(2)
    expect(result.current.cafeCart[0].quantity).toBe(1)
    expect(result.current.cafeCart[1].quantity).toBe(1)
  })

  it('removeCafeItem removes by cartItemId', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.addCafeItem({ ...cafeItem, cartItemId: 'ci-a' })
      result.current.addCafeItem({ ...cafeItem, cartItemId: 'ci-b' })
    })
    act(() => result.current.removeCafeItem('ci-a'))
    expect(result.current.cafeCart).toHaveLength(1)
    expect(result.current.cafeCart[0].cartItemId).toBe('ci-b')
  })

  it('updateCafeQty updates by cartItemId and removes when qty <= 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.addCafeItem({ ...cafeItem, cartItemId: 'ci-a' })
      result.current.addCafeItem({ ...cafeItem, cartItemId: 'ci-b' })
    })
    act(() => result.current.updateCafeQty('ci-a', 5))
    expect(result.current.cafeCart.find(i => i.cartItemId === 'ci-a')?.quantity).toBe(5)
    act(() => result.current.updateCafeQty('ci-b', 0))
    expect(result.current.cafeCart).toHaveLength(1)
  })

  it('assigns cartItemId to legacy persisted items on load', () => {
    localStorage.setItem('grsc_cart_cafe', JSON.stringify([
      { productId: 'p-1', productCode: 'COF-LAT', name: 'Latte', price: 220, quantity: 1, addons: [], specialInstructions: '' },
    ]))
    const { result } = renderHook(() => useCart(), { wrapper })
    expect(result.current.cafeCart).toHaveLength(1)
    expect(result.current.cafeCart[0].cartItemId).toBeTruthy()
  })
})
