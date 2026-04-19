import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

type AddonSelection = { id: string; name: string; price: number }

export type CafeCartItem = {
  cartItemId: string
  productId: string
  productCode: string
  name: string
  price: number
  quantity: number
  addons: AddonSelection[]
  specialInstructions: string
}

function generateCartItemId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `cart_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export type CartSubscription = {
  interval: 'week' | 'month'
  interval_count: number
}

export type ShopCartItem = {
  variantId: string
  productId: string
  productName: string
  variantName: string
  pricePaise: number
  imageUrl: string | null
  quantity: number
  subscription: CartSubscription | null
}

type CartContextType = {
  // Cafe cart (PetPooja flow)
  cafeCart: CafeCartItem[]
  addCafeItem: (item: CafeCartItem) => void
  removeCafeItem: (cartItemId: string) => void
  updateCafeQty: (cartItemId: string, qty: number) => void
  clearCafeCart: () => void
  cafeCount: number
  cafeSubtotal: number

  // Shop cart (Razorpay flow)
  shopCart: ShopCartItem[]
  addShopItem: (item: ShopCartItem) => void
  removeShopItem: (variantId: string) => void
  updateShopQty: (variantId: string, qty: number) => void
  clearShopCart: () => void
  shopCount: number
  shopSubtotalPaise: number

  // Combined count
  cartCount: number

  // Back-compat aliases (existing CartDrawer / FloatingCartButton / MenuBrowseScreen)
  items: CafeCartItem[]
  addItem: (item: CafeCartItem) => void
  removeItem: (cartItemId: string) => void
  updateQty: (cartItemId: string, qty: number) => void
  clearCart: () => void
  itemCount: number
  subtotal: number
}

const CAFE_KEY = 'grsc_cart_cafe'
const SHOP_KEY = 'grsc_cart_shop'

function loadFromStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function ensureCartItemIds(items: CafeCartItem[]): CafeCartItem[] {
  return items.map(item =>
    item.cartItemId ? item : { ...item, cartItemId: generateCartItemId() }
  )
}

const CartContext = createContext<CartContextType>({} as CartContextType)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cafeCart, setCafeCart] = useState<CafeCartItem[]>(() => {
    // Migrate from old single-key storage if present
    const legacy = loadFromStorage<CafeCartItem>('grsc_cart')
    if (legacy.length > 0) {
      try { localStorage.removeItem('grsc_cart') } catch {}
      return ensureCartItemIds(legacy)
    }
    return ensureCartItemIds(loadFromStorage<CafeCartItem>(CAFE_KEY))
  })
  const [shopCart, setShopCart] = useState<ShopCartItem[]>(() => loadFromStorage<ShopCartItem>(SHOP_KEY))

  useEffect(() => {
    try {
      if (cafeCart.length > 0) localStorage.setItem(CAFE_KEY, JSON.stringify(cafeCart))
      else localStorage.removeItem(CAFE_KEY)
    } catch {}
  }, [cafeCart])

  useEffect(() => {
    try {
      if (shopCart.length > 0) localStorage.setItem(SHOP_KEY, JSON.stringify(shopCart))
      else localStorage.removeItem(SHOP_KEY)
    } catch {}
  }, [shopCart])

  // Cafe actions
  const addCafeItem = (item: CafeCartItem) => setCafeCart(prev => {
    const withId = item.cartItemId ? item : { ...item, cartItemId: generateCartItemId() }
    return [...prev, withId]
  })
  const removeCafeItem = (cartItemId: string) =>
    setCafeCart(prev => prev.filter(i => i.cartItemId !== cartItemId))
  const updateCafeQty = (cartItemId: string, qty: number) =>
    setCafeCart(prev => qty <= 0
      ? prev.filter(i => i.cartItemId !== cartItemId)
      : prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity: qty } : i))
  const clearCafeCart = () => {
    setCafeCart([])
    try { localStorage.removeItem(CAFE_KEY) } catch {}
  }

  // Shop actions
  const addShopItem = (item: ShopCartItem) => setShopCart(prev => {
    const existing = prev.find(i => i.variantId === item.variantId)
    if (existing) {
      return prev.map(i => i.variantId === item.variantId ? { ...i, quantity: i.quantity + item.quantity } : i)
    }
    return [...prev, item]
  })
  const removeShopItem = (variantId: string) =>
    setShopCart(prev => prev.filter(i => i.variantId !== variantId))
  const updateShopQty = (variantId: string, qty: number) =>
    setShopCart(prev => qty <= 0
      ? prev.filter(i => i.variantId !== variantId)
      : prev.map(i => i.variantId === variantId ? { ...i, quantity: qty } : i))
  const clearShopCart = () => {
    setShopCart([])
    try { localStorage.removeItem(SHOP_KEY) } catch {}
  }

  // Counts + subtotals
  const cafeCount = cafeCart.reduce((sum, i) => sum + i.quantity, 0)
  const shopCount = shopCart.reduce((sum, i) => sum + i.quantity, 0)
  const cartCount = cafeCount + shopCount
  const cafeSubtotal = cafeCart.reduce(
    (sum, i) => sum + (i.price + i.addons.reduce((a, ad) => a + ad.price, 0)) * i.quantity, 0
  )
  const shopSubtotalPaise = shopCart.reduce((sum, i) => sum + i.pricePaise * i.quantity, 0)

  const value: CartContextType = {
    cafeCart, addCafeItem, removeCafeItem, updateCafeQty, clearCafeCart, cafeCount, cafeSubtotal,
    shopCart, addShopItem, removeShopItem, updateShopQty, clearShopCart, shopCount, shopSubtotalPaise,
    cartCount,
    // Back-compat (existing code using items/addItem/etc. keeps working)
    items: cafeCart,
    addItem: addCafeItem,
    removeItem: removeCafeItem,
    updateQty: updateCafeQty,
    clearCart: clearCafeCart,
    itemCount: cafeCount,
    subtotal: cafeSubtotal,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
