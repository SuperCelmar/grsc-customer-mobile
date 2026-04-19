import { describe, it, expect } from 'vitest'
import { getTopOrderedItems } from '../topItems'
import type { CustomerOrders } from '../../../lib/api'

type Order = CustomerOrders['orders'][number]

function makeOrder(id: string, status: string, items: Order['items']): Order {
  return {
    id,
    source_order_id: id,
    store_name: 'Test Store',
    status,
    order_type: 'Takeaway',
    total_amount: 100,
    loyalty_discount_amount: 0,
    cashback_earned: 0,
    item_count: items.length,
    order_date: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    payment_status: 'Paid',
    reorder_payload: null,
    items,
  }
}

const item = (id: string, name: string, qty: number, price = 100): Order['items'][number] => ({
  id, name, quantity: qty, unit_price: price, addons: [],
})

describe('getTopOrderedItems', () => {
  it('returns empty array for empty orders', () => {
    expect(getTopOrderedItems([])).toEqual([])
  })

  it('returns empty array when fewer than 3 orders provided', () => {
    const orders = [
      makeOrder('o1', 'completed', [item('i1', 'Latte', 2)]),
      makeOrder('o2', 'completed', [item('i1', 'Latte', 1)]),
    ]
    expect(getTopOrderedItems(orders)).toEqual([])
  })

  it('returns top items ranked by quantity across 5 orders', () => {
    const orders = [
      makeOrder('o1', 'completed', [item('i1', 'Latte', 2), item('i2', 'Americano', 1)]),
      makeOrder('o2', 'completed', [item('i1', 'Latte', 1), item('i3', 'Cappuccino', 3)]),
      makeOrder('o3', 'delivered', [item('i2', 'Americano', 2), item('i1', 'Latte', 1)]),
      makeOrder('o4', 'completed', [item('i3', 'Cappuccino', 1), item('i2', 'Americano', 1)]),
      makeOrder('o5', 'completed', [item('i1', 'Latte', 2)]),
    ]
    const result = getTopOrderedItems(orders, 2)
    expect(result).toHaveLength(2)
    // Latte: 2+1+1+2 = 6, Cappuccino: 3+1 = 4, Americano: 1+2+1 = 4
    expect(result[0].id).toBe('i1')
    expect(result[0].name).toBe('Latte')
    expect(result[0].quantity_total).toBe(6)
    expect(result[1].quantity_total).toBeGreaterThanOrEqual(4)
  })

  it('excludes cancelled orders from tally', () => {
    const orders = [
      makeOrder('o1', 'completed', [item('i1', 'Latte', 5)]),
      makeOrder('o2', 'cancelled', [item('i2', 'Americano', 10)]),
      makeOrder('o3', 'completed', [item('i1', 'Latte', 1)]),
      makeOrder('o4', 'completed', [item('i3', 'Cappuccino', 2)]),
    ]
    const result = getTopOrderedItems(orders, 2)
    expect(result.find(r => r.id === 'i2')).toBeUndefined()
    expect(result[0].id).toBe('i1')
  })
})
