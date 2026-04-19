import type { CustomerOrders } from '../../lib/api'

type OrderItem = CustomerOrders['orders'][number]['items'][number]

type CartItem = {
  cartItemId: string
  productId: string
  productCode: string
  name: string
  price: number
  quantity: number
  addons: Array<{ id: string; name: string; price: number }>
  specialInstructions: string
  subscription?: { interval: string; interval_count: number } | null
}

type Props = {
  item: OrderItem | CartItem
  showSubscriptionChip?: boolean
}

function isCartItem(item: OrderItem | CartItem): item is CartItem {
  return 'cartItemId' in item
}

export default function OrderItemCard({ item, showSubscriptionChip }: Props) {
  const name = item.name
  const quantity = item.quantity
  const price = isCartItem(item) ? item.price : item.unit_price
  const addons = isCartItem(item)
    ? item.addons.map(a => a.name)
    : item.addons.map(a => a.addon_name)
  const subscription = isCartItem(item) ? item.subscription : null

  return (
    <div className="border border-[#E8DDD0] rounded-[6px] bg-white p-3 flex items-start gap-3">
      {/* Thumbnail */}
      <div
        className="w-12 h-12 rounded-[6px] bg-[#F5EFE9] flex-shrink-0 overflow-hidden"
        style={{ minWidth: 48 }}
      >
        <div className="w-full h-full flex items-center justify-center text-[#6B6560] text-xs font-medium">
          {name.charAt(0)}
        </div>
      </div>

      {/* Middle */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-[#1A1410] leading-snug">{name}</p>
        {addons.length > 0 && (
          <p className="text-[12px] text-[#6B6560] mt-0.5 line-clamp-2">
            {addons.join(' · ')}
          </p>
        )}
        {showSubscriptionChip && subscription && (
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#F5EFE9] text-[#A0826D] text-[12px]">
            Subscribed — {subscription.interval === 'month' ? 'monthly' : `every ${subscription.interval_count} ${subscription.interval}s`}
          </span>
        )}
      </div>

      {/* Right */}
      <div className="text-[13px] text-[#1A1410] text-right flex-shrink-0">
        {quantity} × ₹{price}
      </div>
    </div>
  )
}
