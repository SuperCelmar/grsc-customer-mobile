import { useState } from 'react'
import { useStoreMenu, useStoreStatus } from '../../hooks/useCustomerProfile'
import { useCart } from '../../contexts/CartContext'
import { OrderingProvider, useOrdering } from './OrderingContext'
import { ProductDetailSheet } from './ProductDetailSheet'
import { VariantPickerSheet } from './VariantPickerSheet'
import { CartDrawer } from './CartDrawer'
import { FloatingCartButton } from './FloatingCartButton'
import type { StoreMenu } from '../../lib/api'

type Product = StoreMenu['products'][number]
type OnlineProduct = StoreMenu['online_products'][number]

function MenuBrowseInner() {
  const { storeInfo, storeLoading } = useOrdering()
  const { data: menuData, isLoading: menuLoading, error: menuError } = useStoreMenu(storeInfo?.storeId || '')
  const { data: storeStatus } = useStoreStatus(storeInfo?.petpoojaRestaurantId || '')
  const { itemCount: _itemCount } = useCart()

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedOnlineProduct, setSelectedOnlineProduct] = useState<OnlineProduct | null>(null)
  const [cartOpen, setCartOpen] = useState(false)

  if (storeLoading || menuLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    )
  }

  if (menuError || !menuData) {
    return (
      <div className="flex items-center justify-center h-screen px-4">
        <p className="text-[var(--text-secondary)] text-sm text-center">Failed to load menu. Please try again.</p>
      </div>
    )
  }

  const isOpen = storeStatus?.store_status === '1'
  const { store, categories: cafeCategories, products } = menuData
  const onlineProducts = menuData.online_products ?? []

  const hasBeans = onlineProducts.some(p => p.category_name === 'Beans')
  const hasHampers = onlineProducts.some(p => p.category_name === 'Hampers')

  const categories = [
    ...cafeCategories,
    ...(hasBeans ? [{ id: 'online-beans', name: 'Beans', sort_order: 1000 }] : []),
    ...(hasHampers ? [{ id: 'online-hampers', name: 'Hampers', sort_order: 1001 }] : []),
  ]

  const filteredCafe = selectedCategory === 'all' || !['online-beans', 'online-hampers'].includes(selectedCategory)
    ? products.filter(p => {
        const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || p.category_ids.includes(selectedCategory)
        return matchesSearch && matchesCategory
      })
    : []

  const filteredOnline: OnlineProduct[] = (() => {
    if (selectedCategory === 'all') {
      return onlineProducts.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    }
    if (selectedCategory === 'online-beans') {
      return onlineProducts.filter(p => p.category_name === 'Beans' && (!search || p.name.toLowerCase().includes(search.toLowerCase())))
    }
    if (selectedCategory === 'online-hampers') {
      return onlineProducts.filter(p => p.category_name === 'Hampers' && (!search || p.name.toLowerCase().includes(search.toLowerCase())))
    }
    return []
  })()

  const totalCount = filteredCafe.length + filteredOnline.length

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 bg-white border-b border-[var(--card)]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-base font-semibold text-[var(--text)]">{store.name}</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isOpen ? '#6B8E23' : '#B42C1F' }}
              />
              <span className="text-xs" style={{ color: isOpen ? '#6B8E23' : '#B42C1F' }}>
                {isOpen ? 'Open Now' : 'Currently Closed'}
              </span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search menu..."
            className="w-full border border-[var(--card)] rounded-lg px-3 py-2 text-sm pl-8 focus:outline-none focus:border-[var(--primary)]"
          />
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('all')}
            className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border"
            style={{
              borderColor: selectedCategory === 'all' ? 'var(--primary)' : 'var(--card)',
              backgroundColor: selectedCategory === 'all' ? 'var(--primary)' : 'white',
              color: selectedCategory === 'all' ? 'white' : 'var(--text)',
            }}
          >All</button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border"
              style={{
                borderColor: selectedCategory === cat.id ? 'var(--primary)' : 'var(--card)',
                backgroundColor: selectedCategory === cat.id ? 'var(--primary)' : 'white',
                color: selectedCategory === cat.id ? 'white' : 'var(--text)',
              }}
            >{cat.name}</button>
          ))}
        </div>
      </div>

      {/* Product list */}
      <div className="flex-1 px-4 py-3 space-y-3">
        {totalCount === 0 ? (
          <p className="text-[var(--text-secondary)] text-sm text-center mt-8">No items found.</p>
        ) : (
          <>
            {filteredCafe.map(product => (
              <div
                key={product.id}
                className="flex items-center justify-between border border-[var(--card)] rounded-lg p-3"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-medium text-[var(--text)] truncate">{product.name}</p>
                  {product.description && (
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>₹{product.price}</p>
                    <span style={{ background: 'var(--muted)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>Pickup ~15 min</span>
                  </div>
                </div>
                <button
                  onClick={() => isOpen && setSelectedProduct(product)}
                  disabled={!isOpen}
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-lg font-medium disabled:opacity-40"
                  style={{ backgroundColor: 'var(--primary)' }}
                >+</button>
              </div>
            ))}

            {filteredOnline.map(product => {
              const lowestPricePaise = product.variants.reduce(
                (min, v) => (v.price_paise < min ? v.price_paise : min),
                product.variants[0]?.price_paise ?? 0
              )
              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between border border-[var(--card)] rounded-lg p-3"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0 mr-3">
                    {product.image_url ? (
                      <img
                        loading="lazy"
                        src={product.image_url}
                        alt={product.name}
                        className="flex-shrink-0 rounded-lg object-cover"
                        style={{ width: 40, height: 40 }}
                      />
                    ) : (
                      <div
                        className="flex-shrink-0 rounded-lg"
                        style={{ width: 40, height: 40, backgroundColor: 'var(--muted)' }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text)] truncate">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{product.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>from ₹{Math.floor(lowestPricePaise / 100)}</p>
                        <span style={{ background: 'var(--muted)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>Ships in 2-3 days</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedOnlineProduct(product)}
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-lg font-medium"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >+</button>
                </div>
              )
            })}
          </>
        )}
      </div>

      <FloatingCartButton onClick={() => setCartOpen(true)} />

      {selectedProduct && (
        <ProductDetailSheet
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {selectedOnlineProduct && (
        <VariantPickerSheet
          product={selectedOnlineProduct}
          onClose={() => setSelectedOnlineProduct(null)}
        />
      )}

      {cartOpen && storeInfo && (
        <CartDrawer
          onClose={() => setCartOpen(false)}
          storeRestId={storeInfo.petpoojaRestaurantId}
          storeId={storeInfo.storeId}
          isStoreOpen={isOpen}
        />
      )}
    </div>
  )
}

export function MenuBrowseScreen() {
  return (
    <OrderingProvider>
      <MenuBrowseInner />
    </OrderingProvider>
  )
}
