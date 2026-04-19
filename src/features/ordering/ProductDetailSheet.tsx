import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import type { StoreMenu } from '../../lib/api'

type Product = StoreMenu['products'][number]

type Props = {
  product: Product
  onClose: () => void
  onViewCart?: () => void
}

export function ProductDetailSheet({ product, onClose, onViewCart }: Props) {
  const { addItem, cartCount } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [selectedAddons, setSelectedAddons] = useState<Record<string, string[]>>({})
  const [specialInstructions, setSpecialInstructions] = useState('')

  function toggleAddon(groupId: string, addonId: string, maxSelection: number) {
    setSelectedAddons(prev => {
      const current = prev[groupId] || []
      if (current.includes(addonId)) {
        return { ...prev, [groupId]: current.filter(id => id !== addonId) }
      }
      if (maxSelection === 1) {
        return { ...prev, [groupId]: [addonId] }
      }
      if (current.length >= maxSelection) return prev
      return { ...prev, [groupId]: [...current, addonId] }
    })
  }

  function isAddonSelected(groupId: string, addonId: string) {
    return (selectedAddons[groupId] || []).includes(addonId)
  }

  function canAddToCart() {
    for (const group of product.addon_groups) {
      const selected = (selectedAddons[group.id] || []).length
      if (selected < group.min_selection) return false
    }
    return true
  }

  function getAddonPrice() {
    return product.addon_groups.flatMap(g =>
      g.addons.filter(a => isAddonSelected(g.id, a.id))
    ).reduce((sum, a) => sum + a.price, 0)
  }

  function handleAddToCart() {
    if (!canAddToCart()) return
    const addons = product.addon_groups.flatMap(g =>
      g.addons.filter(a => isAddonSelected(g.id, a.id)).map(a => ({
        id: a.code,
        name: a.name,
        price: a.price,
      }))
    )
    const cartItemId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `cart_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    addItem({
      cartItemId,
      productId: product.id,
      productCode: product.id,
      name: product.name,
      price: product.price,
      quantity,
      addons,
      specialInstructions,
    })
    onClose()
  }

  const totalPrice = (product.price + getAddonPrice()) * quantity

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Hero: monogram fallback for cafe products (no image_url in cafe menu).
            When Petpooja image URLs ship, swap this block for an <img>. */}
        <div
          className="relative flex-shrink-0 flex items-center justify-center"
          style={{ height: 240, backgroundColor: 'var(--muted)' }}
        >
          <span
            className="select-none"
            style={{
              fontFamily: 'serif',
              fontSize: 72,
              fontWeight: 600,
              color: 'var(--primary)',
              letterSpacing: '-0.02em',
            }}
          >
            GR
          </span>
          {onViewCart && cartCount > 0 && (
            <button
              onClick={() => { onClose(); onViewCart() }}
              aria-label="View cart"
              className="absolute top-3 left-3 h-9 px-3 rounded-full bg-white shadow-sm flex items-center gap-1.5 text-sm font-medium"
              style={{ color: 'var(--text)' }}
            >
              <ShoppingBag size={14} />
              Cart · {cartCount}
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm"
            style={{ color: 'var(--text)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Title + price */}
        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          <h2 className="text-lg font-semibold text-[var(--text)]" style={{ fontFamily: 'serif' }}>
            {product.name}
          </h2>
          <p className="text-[var(--primary)] font-medium">₹{product.price}</p>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 space-y-5">
          {product.description && (
            <p className="text-sm text-[var(--text-secondary)]">{product.description}</p>
          )}

          {product.addon_groups.map(group => (
            <div key={group.id}>
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-sm font-semibold text-[var(--text)]">{group.name}</h3>
                <span className="text-xs text-[var(--text-secondary)]">
                  {group.min_selection > 0 ? `Required · ` : ''}
                  {group.max_selection === 1 ? 'Choose 1' : `Up to ${group.max_selection}`}
                </span>
              </div>
              <div className="space-y-2">
                {group.addons.map(addon => {
                  const selected = isAddonSelected(group.id, addon.id)
                  const isRadio = group.max_selection === 1
                  return (
                    <button
                      key={addon.id}
                      onClick={() => toggleAddon(group.id, addon.id, group.max_selection)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm"
                      style={{
                        borderColor: selected ? 'var(--primary)' : 'var(--card)',
                        backgroundColor: selected ? 'var(--muted)' : 'white',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 flex-shrink-0 border flex items-center justify-center"
                          style={{
                            borderRadius: isRadio ? '50%' : '4px',
                            borderColor: selected ? 'var(--primary)' : 'var(--text-secondary)',
                            backgroundColor: selected ? 'var(--primary)' : 'white',
                          }}
                        >
                          {selected && <span className="w-2 h-2 bg-white rounded-full block" />}
                        </span>
                        <span className="text-[var(--text)]">{addon.name}</span>
                      </div>
                      {addon.price > 0 && (
                        <span className="text-[var(--text-secondary)]">+₹{addon.price}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <div>
            <label className="text-sm font-medium text-[var(--text)] block mb-1">Special Instructions</label>
            <textarea
              value={specialInstructions}
              onChange={e => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests?"
              rows={2}
              className="w-full border border-[var(--card)] rounded-lg px-3 py-2 text-sm text-[var(--text)] resize-none focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>

        {/* Sticky bottom bar: stepper + total + CTA */}
        <div className="flex-shrink-0 bg-white border-t border-[var(--card)] px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 border border-[var(--card)] rounded-lg px-2 py-1 flex-shrink-0">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-7 h-7 flex items-center justify-center text-[var(--text)] font-medium"
              aria-label="Decrease quantity"
            >−</button>
            <span className="text-[var(--text)] font-medium w-5 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(q => Math.min(99, q + 1))}
              className="w-7 h-7 flex items-center justify-center text-[var(--text)] font-medium"
              aria-label="Increase quantity"
            >+</button>
          </div>
          <div className="flex-shrink-0">
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)] leading-none">Total</p>
            <p className="text-base font-semibold text-[var(--text)] leading-tight">₹{totalPrice.toFixed(0)}</p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart()}
            className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-40"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}
