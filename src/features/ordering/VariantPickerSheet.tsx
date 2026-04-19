import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import type { CartSubscription } from '../../contexts/CartContext'
import type { StoreMenu } from '../../lib/api'

type OnlineProduct = StoreMenu['online_products'][number]
type Variant = OnlineProduct['variants'][number]

type PurchaseType = 'one-time' | 'biweekly' | 'monthly'

type Props = {
  product: OnlineProduct
  onClose: () => void
  onViewCart?: () => void
}

export function VariantPickerSheet({ product, onClose, onViewCart }: Props) {
  const { addShopItem, cartCount } = useCart()

  const firstInStock = product.variants.find(v => v.stock_status === 'instock') ?? null

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    firstInStock?.variant_id ?? null
  )
  const [quantity, setQuantity] = useState(1)
  const [purchaseType, setPurchaseType] = useState<PurchaseType>('one-time')

  const selectedVariant: Variant | undefined = product.variants.find(
    v => v.variant_id === selectedVariantId
  )

  const lowestPricePaise = product.variants.reduce(
    (min, v) => (v.price_paise < min ? v.price_paise : min),
    product.variants[0]?.price_paise ?? 0
  )

  function getVariantHeading() {
    const hasGrind = product.variants.some(v => 'grind-size' in v.attributes)
    const hasPackage = product.variants.some(v => 'package' in v.attributes)
    if (hasGrind) return 'Grind Size'
    if (hasPackage) return 'Package'
    return 'Variant'
  }

  function getSubscription(): CartSubscription | null {
    if (!product.subscription_eligible || purchaseType === 'one-time') return null
    if (purchaseType === 'biweekly') return { interval: 'week', interval_count: 2 }
    return { interval: 'month', interval_count: 1 }
  }

  function getEffectivePricePaise(basePaise: number): number {
    return purchaseType === 'one-time' ? basePaise : Math.round(basePaise * 0.9)
  }

  function handleAddToCart() {
    if (!selectedVariant) return
    addShopItem({
      variantId: selectedVariant.variant_id,
      productId: product.id,
      productName: product.name,
      variantName: selectedVariant.name,
      pricePaise: getEffectivePricePaise(selectedVariant.price_paise),
      imageUrl: product.image_url,
      quantity,
      subscription: getSubscription(),
    })
    onClose()
  }

  const effectivePricePaise = selectedVariant
    ? getEffectivePricePaise(selectedVariant.price_paise)
    : 0
  const totalRupees = (effectivePricePaise / 100) * quantity

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Hero */}
        <div
          className="relative flex-shrink-0 flex items-center justify-center"
          style={{ height: 240, backgroundColor: 'var(--muted)' }}
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
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
          )}
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
          <p className="text-[var(--primary)] font-medium">
            from ₹{Math.floor(lowestPricePaise / 100)}
          </p>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 space-y-5">
          {product.description && (
            <p className="text-sm text-[var(--text-secondary)]">{product.description}</p>
          )}

          <div>
            <h3 className="text-sm font-semibold text-[var(--text)] mb-2">{getVariantHeading()}</h3>
            <div className="space-y-2">
              {product.variants.map(variant => {
                const selected = variant.variant_id === selectedVariantId
                const outOfStock = variant.stock_status === 'outofstock'
                return (
                  <button
                    key={variant.variant_id}
                    disabled={outOfStock}
                    onClick={() => setSelectedVariantId(variant.variant_id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm"
                    style={{
                      borderColor: selected ? 'var(--primary)' : 'var(--card)',
                      backgroundColor: selected ? 'var(--muted)' : 'white',
                      opacity: outOfStock ? 0.4 : 1,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 flex-shrink-0 border flex items-center justify-center"
                        style={{
                          borderRadius: '50%',
                          borderColor: selected ? 'var(--primary)' : 'var(--text-secondary)',
                          backgroundColor: selected ? 'var(--primary)' : 'white',
                        }}
                      >
                        {selected && <span className="w-2 h-2 bg-white rounded-full block" />}
                      </span>
                      <span className="text-[var(--text)]">{variant.name}</span>
                    </div>
                    {outOfStock ? (
                      <span className="text-[var(--text-secondary)]">Out of stock</span>
                    ) : (
                      <span className="text-[var(--text-secondary)]">₹{variant.price_paise / 100}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {product.subscription_eligible && selectedVariant && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)] mb-2">Purchase type</h3>
              <div className="space-y-2">
                {([
                  { type: 'one-time' as PurchaseType, label: 'One-time purchase', sublabel: null },
                  { type: 'biweekly' as PurchaseType, label: 'Subscribe & save 10%', sublabel: 'Every 2 weeks' },
                  { type: 'monthly' as PurchaseType, label: 'Subscribe & save 10%', sublabel: 'Monthly' },
                ]).map(({ type, label, sublabel }) => {
                  const selected = purchaseType === type
                  const basePaise = selectedVariant.price_paise
                  const pricePaise = type === 'one-time' ? basePaise : Math.round(basePaise * 0.9)
                  return (
                    <button
                      key={type}
                      onClick={() => setPurchaseType(type)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm"
                      style={{
                        borderColor: selected ? '#D4A574' : 'var(--card)',
                        backgroundColor: selected ? '#FDF8F3' : 'white',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 flex-shrink-0 border flex items-center justify-center"
                          style={{
                            borderRadius: '50%',
                            borderColor: selected ? '#D4A574' : 'var(--text-secondary)',
                            backgroundColor: selected ? '#D4A574' : 'white',
                          }}
                        >
                          {selected && <span className="w-2 h-2 bg-white rounded-full block" />}
                        </span>
                        <div className="text-left">
                          <span className="text-[var(--text)]">{label}</span>
                          {sublabel && (
                            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#F0F4E8', color: '#6B8E23' }}>
                              {sublabel}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[var(--text-secondary)]">₹{pricePaise / 100}</span>
                        {type !== 'one-time' && (
                          <span className="ml-1 text-xs line-through text-[var(--text-secondary)] opacity-60">₹{basePaise / 100}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
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
            <p className="text-base font-semibold text-[var(--text)] leading-tight">₹{totalRupees.toFixed(0)}</p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant}
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
