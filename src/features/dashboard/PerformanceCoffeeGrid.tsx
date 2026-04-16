import { Plus, Truck } from 'lucide-react'
import type { StoreMenu } from '../../lib/api'

type OnlineProduct = StoreMenu['online_products'][number]

type Props = {
  products: OnlineProduct[]
  onSelect: (product: OnlineProduct) => void
  onQuickAdd: (product: OnlineProduct) => void
}

export function PerformanceCoffeeGrid({ products, onSelect, onQuickAdd }: Props) {
  const items = products.filter(p => p.category_name === 'Performance Coffee').slice(0, 4)

  if (items.length === 0) return null

  return (
    <div className="px-4">
      <div className="grid grid-cols-2 gap-4">
        {items.map(product => {
          const minPricePaise = product.variants.length > 0
            ? Math.min(...product.variants.map(v => v.price_paise))
            : 0

          return (
            <div
              key={product.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(product)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(product)
                }
              }}
              className="relative bg-[#E8DDD0] rounded-md p-3 flex flex-col active:scale-95 transition-transform duration-100 text-left cursor-pointer"
              style={{ aspectRatio: '3/4' }}
            >
              <div className="absolute top-3 left-3 flex items-center gap-1 bg-text-dark/80 backdrop-blur-md border border-white/10 px-2 py-1 rounded-sm z-10">
                <Truck className="w-2.5 h-2.5 text-primary" strokeWidth={2.5} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Ships 2-3 days</span>
              </div>

              <div className="relative mb-2">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    loading="lazy"
                    className="aspect-square w-full rounded object-cover"
                  />
                ) : (
                  <div className="aspect-square w-full rounded bg-muted" />
                )}
                <button
                  type="button"
                  aria-label={`Add ${product.name} to cart`}
                  onClick={e => { e.stopPropagation(); onQuickAdd(product) }}
                  className="absolute -bottom-5 right-0 w-10 h-10 rounded-full bg-primary text-text-dark flex items-center justify-center shadow-lg shadow-[#D4A574]/40 active:scale-90 transition-transform duration-100 z-10"
                >
                  <Plus className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>

              <p className="font-display text-base leading-tight font-semibold text-text-dark line-clamp-2 pr-12">
                {product.name}
              </p>
              <p className="text-[11px] text-text-secondary uppercase tracking-tight mt-1">
                {product.variants.length} grind sizes
              </p>
              <p className="text-sm font-extrabold text-primary mt-2">
                from ₹{Math.floor(minPricePaise / 100)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
