import { useState } from 'react'
import { useCart } from '../../contexts/CartContext'
import type { StoreMenu } from '../../lib/api'

type Product = StoreMenu['products'][number]

type Props = {
  product: Product
  onClose: () => void
}

export function ProductDetailSheet({ product, onClose }: Props) {
  const { addItem } = useCart()
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
    addItem({
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
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-4 pt-4 pb-2 flex items-start justify-between border-b border-[var(--card)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">{product.name}</h2>
            <p className="text-[var(--primary)] font-medium">₹{product.price}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] text-xl leading-none p-1">×</button>
        </div>

        <div className="px-4 pb-6 pt-3 space-y-5">
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

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 border border-[var(--card)] rounded-lg px-2 py-1">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-7 h-7 flex items-center justify-center text-[var(--text)] font-medium"
              >−</button>
              <span className="text-[var(--text)] font-medium w-5 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-7 h-7 flex items-center justify-center text-[var(--text)] font-medium"
              >+</button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart()}
              className="flex-1 ml-3 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-40"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Add to Cart · ₹{totalPrice.toFixed(0)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
