import { useState } from 'react'
import { useCart } from '../../contexts/CartContext'
import type { StoreMenu } from '../../lib/api'

type OnlineProduct = StoreMenu['online_products'][number]
type Variant = OnlineProduct['variants'][number]

type Props = {
  product: OnlineProduct
  onClose: () => void
}

export function VariantPickerSheet({ product, onClose }: Props) {
  const { addShopItem } = useCart()

  const firstInStock = product.variants.find(v => v.stock_status === 'instock') ?? null

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    firstInStock?.variant_id ?? null
  )
  const [quantity, setQuantity] = useState(1)

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

  function handleAddToCart() {
    if (!selectedVariant) return
    addShopItem({
      variantId: selectedVariant.variant_id,
      productId: product.id,
      productName: product.name,
      variantName: selectedVariant.name,
      pricePaise: selectedVariant.price_paise,
      imageUrl: product.image_url,
      quantity,
    })
    onClose()
  }

  const totalRupees = selectedVariant
    ? (selectedVariant.price_paise / 100) * quantity
    : 0

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-white px-4 pt-4 pb-2 flex items-start justify-between border-b border-[var(--card)] rounded-t-2xl">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">{product.name}</h2>
            <p className="text-[var(--primary)] font-medium">
              from ₹{Math.floor(lowestPricePaise / 100)}
            </p>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] text-xl leading-none p-1">×</button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 pb-6 pt-3 space-y-5">
          {product.image_url ? (
            <img
              src={product.image_url}
              loading="lazy"
              alt={product.name}
              className="w-full rounded"
              style={{ height: '200px', objectFit: 'cover' }}
            />
          ) : (
            <div
              className="w-full rounded"
              style={{ height: '200px', backgroundColor: 'var(--muted)' }}
            />
          )}

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

          <div className="flex items-center gap-3 border border-[var(--card)] rounded-lg px-2 py-1 self-start w-fit">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-7 h-7 flex items-center justify-center text-[var(--text)] font-medium"
            >−</button>
            <span className="text-[var(--text)] font-medium w-5 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(q => Math.min(99, q + 1))}
              className="w-7 h-7 flex items-center justify-center text-[var(--text)] font-medium"
            >+</button>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-4 py-3 border-t border-[var(--card)]">
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant}
            className="w-full py-3 rounded-lg text-white text-sm font-semibold disabled:opacity-40"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Add to Cart · ₹{totalRupees.toFixed(0)}
          </button>
        </div>
      </div>
    </div>
  )
}
