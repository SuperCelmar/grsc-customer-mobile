import type { CustomerOrders } from '../../lib/api'

type Order = CustomerOrders['orders'][number]
type OrderItem = Order['items'][number]

export type TopItem = {
  id: string
  name: string
  thumbnail: string | null
  quantity_total: number
  price: number
  source_item: OrderItem
}

const MIN_ORDERS_THRESHOLD = 3

export function getTopOrderedItems(orders: Order[], limit = 2): TopItem[] {
  const nonCancelled = orders.filter(o => o.status !== 'cancelled')
  if (nonCancelled.length < MIN_ORDERS_THRESHOLD) return []

  const tally = new Map<string, { item: OrderItem; count: number }>()

  for (const order of nonCancelled) {
    for (const item of order.items) {
      const key = item.id || item.name
      const existing = tally.get(key)
      if (existing) {
        existing.count += item.quantity
      } else {
        tally.set(key, { item, count: item.quantity })
      }
    }
  }

  return Array.from(tally.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ item, count }) => ({
      id: item.id || item.name,
      name: item.name,
      thumbnail: null,
      quantity_total: count,
      price: item.unit_price,
      source_item: item,
    }))
}
