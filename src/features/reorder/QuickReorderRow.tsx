import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCustomerOrders } from '../../hooks/useCustomerProfile'
import { useCart } from '../../contexts/CartContext'
import { useReorder } from '../orders/useReorder'
import { getTopOrderedItems } from '../orders/topItems'
import type { CafeCartItem } from '../../contexts/CartContext'
import type { CustomerOrders } from '../../lib/api'

type Order = CustomerOrders['orders'][number]
type OrderItem = Order['items'][number]

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `cart_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/** Returns the most-frequent addon combination for a given item across all orders. */
function getMostFrequentAddons(orders: Order[], itemId: string): OrderItem['addons'] {
  const specCount = new Map<string, { addons: OrderItem['addons']; count: number }>()
  for (const order of orders) {
    for (const item of order.items) {
      if ((item.id || item.name) !== itemId) continue
      const key = item.addons.map(a => a.addon_name).sort().join('|')
      const existing = specCount.get(key)
      if (existing) {
        existing.count++
      } else {
        specCount.set(key, { addons: item.addons, count: 1 })
      }
    }
  }
  if (specCount.size === 0) return []
  return Array.from(specCount.values()).sort((a, b) => b.count - a.count)[0].addons
}

/** Builds a short readable spec label like "Oat · Large" from addons. */
function buildUsualSpec(addons: OrderItem['addons']): string {
  return addons.map(a => a.addon_name).join(' · ')
}

/** Builds item name summary: "Cappuccino · Classic Latte + 1 more" */
function buildItemSummary(items: Order['items']): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0].name
  if (items.length === 2) return `${items[0].name} · ${items[1].name}`
  return `${items[0].name} · ${items[1].name} + ${items.length - 2} more`
}

export function QuickReorderRow() {
  const navigate = useNavigate()
  const { data } = useCustomerOrders(1)
  const { addCafeItem } = useCart()
  const { canReorder, reorder } = useReorder()

  const orders = data?.orders ?? []
  const topItems = getTopOrderedItems(orders, 2)
  const isEmpty = orders.length === 0 || topItems.length === 0

  const lastOrder = orders.find(o => !['cancelled'].includes(o.status))
  const lastDate = lastOrder
    ? new Date(lastOrder.order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null

  if (isEmpty) {
    return (
      <div className="px-4 py-2">
        <h2 className="text-[17px] font-bold text-[#1A1410] mb-3" style={{ fontFamily: 'serif' }}>
          Quick Reorder
        </h2>
        <button
          onClick={() => navigate('/order')}
          className="w-full border border-[var(--card)] rounded-[6px] bg-white px-4 py-3 text-sm text-[#6B6560] text-left"
        >
          Browse the menu →
        </button>
      </div>
    )
  }

  return (
    <div className="py-2 -mx-4">
      <h2 className="px-4 text-[17px] font-bold text-[#1A1410] mb-3" style={{ fontFamily: 'serif' }}>
        Quick Reorder
      </h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 pl-4 pr-8 snap-x snap-mandatory">
        {/* Card 1: Reorder last */}
        <div
          className="flex-shrink-0 w-[150px] snap-start border border-[#E8DDD0] rounded-[6px] bg-white p-3 flex flex-col justify-between"
        >
          <div>
            <p className="text-[13px] font-medium text-[#1A1410] leading-snug">Reorder last</p>
            {lastOrder && (
              <>
                {lastOrder.items.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {lastOrder.items.slice(0, 2).map((item, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-[4px] bg-[#F5EFE9] flex items-center justify-center text-[#6B6560] text-[10px] font-medium flex-shrink-0"
                      >
                        {item.name.charAt(0)}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-[#6B6560] mt-1.5 line-clamp-2 leading-snug">
                  {buildItemSummary(lastOrder.items)}
                </p>
                <p className="text-[11px] text-[#6B6560] mt-0.5">
                  {lastDate} · ₹{lastOrder.total_amount}
                </p>
              </>
            )}
          </div>
          <button
            onClick={() => {
              if (canReorder) {
                reorder()
              } else {
                toast.success('Reordering your last order…')
                navigate('/order')
              }
            }}
            className="mt-3 w-full py-1.5 rounded-[6px] text-[12px] font-medium text-[#1A1410] shadow-sm"
            style={{ backgroundColor: '#D4A574' }}
          >
            Reorder
          </button>
        </div>

        {/* Cards 2–3: Top ordered items */}
        {topItems.map(topItem => {
          const usualAddons = getMostFrequentAddons(orders, topItem.id)
          const usualSpec = buildUsualSpec(usualAddons)
          return (
            <div
              key={topItem.id}
              className="flex-shrink-0 w-[150px] snap-start border border-[#E8DDD0] rounded-[6px] bg-white p-3 relative"
            >
              <div
                className="w-[52px] h-[52px] rounded-[6px] bg-[#F5EFE9] flex items-center justify-center text-[#6B6560] text-sm font-medium mb-2 overflow-hidden"
              >
                {topItem.name.charAt(0)}
              </div>
              <p className="text-[14px] text-[#1A1410] font-medium leading-snug line-clamp-2">{topItem.name}</p>
              {usualSpec && (
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: '#6B6560' }}>
                  Usual: {usualSpec}
                </p>
              )}
              <p className="text-[12px] text-[#6B6560] mt-0.5">₹{topItem.price}</p>
              {/* TODO (next sprint): open ProductDetailSheet prefilled with usualAddons once it accepts a defaultAddons prop */}
              <button
                onClick={() => {
                  const cartItem: CafeCartItem = {
                    cartItemId: generateId(),
                    productId: topItem.source_item.id,
                    productCode: topItem.source_item.id,
                    name: topItem.name,
                    price: topItem.price,
                    quantity: 1,
                    addons: usualAddons.map(a => ({ id: a.addon_name, name: a.addon_name, price: a.addon_price })),
                    specialInstructions: '',
                  }
                  addCafeItem(cartItem)
                  toast.success(`${topItem.name} added to cart`)
                }}
                className="absolute bottom-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-[#1A1410] text-lg leading-none shadow-sm"
                style={{ backgroundColor: '#D4A574' }}
                aria-label={`Add ${topItem.name} to cart`}
              >
                +
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
