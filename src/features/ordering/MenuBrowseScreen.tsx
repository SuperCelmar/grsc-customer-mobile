import { useState, useEffect, useRef, useMemo } from 'react'
import { ShoppingBag } from 'lucide-react'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useSearchParams } from 'react-router-dom'
import { useStoreMenu, useStoreStatus } from '../../hooks/useCustomerProfile'
import { useCart } from '../../contexts/CartContext'
import { OrderingProvider, useOrdering } from './OrderingContext'
import { ProductDetailSheet } from './ProductDetailSheet'
import { VariantPickerSheet } from './VariantPickerSheet'
import { CartDrawer } from './CartDrawer'
import { FloatingCartButton } from './FloatingCartButton'
import { getCategoryIcon } from '../../assets/category-icons'
import type { CategoryIcon } from '../../assets/category-icons'
import type { StoreMenu } from '../../lib/api'

type Product = StoreMenu['products'][number]
type OnlineProduct = StoreMenu['online_products'][number]

function CategoryPill({
  label,
  active,
  onClick,
  Icon,
}: {
  label: string
  active: boolean
  onClick: () => void
  Icon: CategoryIcon | null
}) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 flex items-center px-4 py-2 rounded-md text-sm font-medium border transition-colors"
      style={{
        height: 40,
        borderRadius: 6,
        borderColor: active ? 'var(--primary)' : 'var(--card)',
        backgroundColor: active ? 'var(--primary)' : 'white',
        color: active ? 'white' : 'var(--text)',
      }}
    >
      {Icon ? (
        <Icon className="w-4 h-4 mr-2" />
      ) : (
        <span
          className="w-4 h-4 mr-2 flex items-center justify-center rounded-full text-[10px] font-semibold"
          style={{
            backgroundColor: active ? 'white' : 'var(--primary)',
            color: active ? 'var(--primary)' : 'white',
          }}
        >
          {label.charAt(0).toUpperCase()}
        </span>
      )}
      {label}
    </button>
  )
}

function ProductCard({
  name,
  priceLabel,
  imageUrl,
  onCardClick,
  onAddClick,
  disabled,
}: {
  name: string
  priceLabel: string
  imageUrl: string | null
  onCardClick: () => void
  onAddClick: () => void
  disabled?: boolean
}) {
  return (
    <div
      className="relative border border-[var(--card)] rounded-md overflow-hidden bg-white"
      style={{ borderRadius: 6 }}
    >
      <button
        type="button"
        onClick={onCardClick}
        disabled={disabled}
        className="block w-full text-left disabled:opacity-60"
      >
        <div
          className="aspect-square w-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--muted)', borderRadius: 6 }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover"
              style={{ borderRadius: 6 }}
            />
          ) : (
            <span
              className="font-semibold"
              style={{
                fontFamily: 'serif',
                color: 'var(--primary)',
                fontSize: 28,
                letterSpacing: 1,
              }}
            >
              GR
            </span>
          )}
        </div>
        <div className="px-2.5 pt-2 pb-2.5">
          <p
            className="text-[var(--text)] line-clamp-2"
            style={{ fontFamily: 'serif', fontSize: 14, lineHeight: '18px', minHeight: 36 }}
          >
            {name}
          </p>
          <p
            className="font-semibold mt-1"
            style={{ color: 'var(--primary)', fontSize: 14 }}
          >
            {priceLabel}
          </p>
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onAddClick()
        }}
        disabled={disabled}
        aria-label={`Add ${name}`}
        className="absolute flex items-center justify-center text-white font-medium disabled:opacity-40"
        style={{
          right: 8,
          bottom: 8,
          width: 32,
          height: 32,
          borderRadius: 6,
          backgroundColor: 'var(--primary)',
          fontSize: 18,
          lineHeight: 1,
        }}
      >
        +
      </button>
    </div>
  )
}

function MenuBrowseInner() {
  const { storeInfo, storeLoading } = useOrdering()
  const { data: menuData, isLoading: menuLoading, error: menuError } = useStoreMenu(storeInfo?.storeId || '')
  const { data: storeStatus } = useStoreStatus(storeInfo?.petpoojaRestaurantId || '')
  const { cartCount, addItem } = useCart()
  const [searchParams] = useSearchParams()
  const applied = useRef(false)

  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedOnlineProduct, setSelectedOnlineProduct] = useState<OnlineProduct | null>(null)
  const [cartOpen, setCartOpen] = useState(false)

  // Build combined category list (cafe + virtual online categories)
  const categories = useMemo(() => {
    if (!menuData) return [] as Array<{ id: string; name: string; sort_order: number }>
    const onlineProducts = menuData.online_products ?? []
    const hasPerformanceCoffee = onlineProducts.some(p => p.category_name === 'Performance Coffee')
    const hasHampers = onlineProducts.some(p => p.category_name === 'Hampers')
    return [
      ...menuData.categories,
      ...(hasPerformanceCoffee ? [{ id: 'online-performance-coffee', name: 'Performance Coffee', sort_order: 1000 }] : []),
      ...(hasHampers ? [{ id: 'online-hampers', name: 'Hampers', sort_order: 1001 }] : []),
    ]
  }, [menuData])

  // Auto-select first category + honor ?category= if valid
  useEffect(() => {
    if (!menuData || applied.current) return
    applied.current = true

    const validIds = new Set<string>(categories.map(c => c.id))
    const categoryParam = searchParams.get('category')
    if (categoryParam && validIds.has(categoryParam)) {
      setSelectedCategory(categoryParam)
    } else if (categories.length > 0) {
      setSelectedCategory(categories[0].id)
    }

    const productParam = searchParams.get('product')
    if (productParam) {
      const found = menuData.products.find(p => p.id === productParam)
      if (found) {
        setSelectedProduct(found)
      } else {
        const onlineProducts = menuData.online_products ?? []
        const foundOnline = onlineProducts.find(p => p.id === productParam)
        if (foundOnline) {
          setSelectedOnlineProduct(foundOnline)
        }
      }
    }
  }, [menuData, categories, searchParams])

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
  const { store, products } = menuData
  const onlineProducts = menuData.online_products ?? []

  const isOnlineCategory = selectedCategory === 'online-performance-coffee' || selectedCategory === 'online-hampers'

  const filteredCafe = !isOnlineCategory
    ? products.filter(p => {
        const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = !selectedCategory || p.category_ids.includes(selectedCategory)
        return matchesSearch && matchesCategory
      })
    : []

  const filteredOnline: OnlineProduct[] = (() => {
    if (selectedCategory === 'online-performance-coffee') {
      return onlineProducts.filter(p => p.category_name === 'Performance Coffee' && (!search || p.name.toLowerCase().includes(search.toLowerCase())))
    }
    if (selectedCategory === 'online-hampers') {
      return onlineProducts.filter(p => p.category_name === 'Hampers' && (!search || p.name.toLowerCase().includes(search.toLowerCase())))
    }
    return []
  })()

  const totalCount = filteredCafe.length + filteredOnline.length

  function handleCafeCardClick(product: Product) {
    if (!isOpen) return
    setSelectedProduct(product)
  }

  function handleCafeAddClick(product: Product) {
    if (!isOpen) return
    if (product.addon_groups.length > 0) {
      setSelectedProduct(product)
      return
    }
    // Simple quick-add: no addons
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
      quantity: 1,
      addons: [],
      specialInstructions: '',
    })
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <ScreenHeader
        title={store.name}
        showStatus
        isOpen={isOpen}
        statusLabel={isOpen ? `Open Now · Pickup ~15 min` : 'Currently Closed'}
        rightAction="cart"
        onRightActionClick={() => setCartOpen(true)}
        cartCount={cartCount}
      />

      {/* Search */}
      <div className="px-4 pb-4 bg-white border-b border-card">
        <div className="relative">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search menu..."
            className="w-full border border-card rounded-lg px-3 py-2 text-sm pl-8 focus:outline-none focus:border-primary"
          />
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Categories section — sticky */}
      <div className="sticky top-0 z-10 bg-white border-b border-[var(--card)] px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <h2
            className="text-[var(--text)]"
            style={{ fontFamily: 'serif', fontSize: 14, fontWeight: 600 }}
          >
            Categories
          </h2>
          {/* Inert grid/list toggle placeholder — functionality flagged for P3 */}
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center text-[var(--text-secondary)]"
            style={{ width: 24, height: 24 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <CategoryPill
              key={cat.id}
              label={cat.name}
              active={selectedCategory === cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              Icon={getCategoryIcon(cat.name)}
            />
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="flex-1 px-4 py-3">
        {totalCount === 0 ? (
          <p className="text-[var(--text-secondary)] text-sm text-center mt-8">No items found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredCafe.map(product => (
              <ProductCard
                key={product.id}
                name={product.name}
                priceLabel={`₹${product.price}`}
                imageUrl={null}
                onCardClick={() => handleCafeCardClick(product)}
                onAddClick={() => handleCafeAddClick(product)}
                disabled={!isOpen}
              />
            ))}

            {filteredOnline.map(product => {
              const lowestPricePaise = product.variants.reduce(
                (min, v) => (v.price_paise < min ? v.price_paise : min),
                product.variants[0]?.price_paise ?? 0
              )
              return (
                <ProductCard
                  key={product.id}
                  name={product.name}
                  priceLabel={`from ₹${Math.floor(lowestPricePaise / 100)}`}
                  imageUrl={product.image_url}
                  onCardClick={() => setSelectedOnlineProduct(product)}
                  onAddClick={() => setSelectedOnlineProduct(product)}
                />
              )
            })}
          </div>
        )}
      </div>

      <FloatingCartButton onClick={() => setCartOpen(true)} />

      {selectedProduct && (
        <ProductDetailSheet
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onViewCart={() => setCartOpen(true)}
        />
      )}

      {selectedOnlineProduct && (
        <VariantPickerSheet
          product={selectedOnlineProduct}
          onClose={() => setSelectedOnlineProduct(null)}
          onViewCart={() => setCartOpen(true)}
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
