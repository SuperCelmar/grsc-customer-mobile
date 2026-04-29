import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCustomerOrders, useStoreMenu } from '../../hooks/useCustomerProfile'
import { useCart } from '../../contexts/CartContext'
import { useOrdering } from '../ordering/OrderingContext'
import type { CustomerOrders, ReorderPayload } from '../../lib/api'

type Order = CustomerOrders['orders'][number]

const isReorderable = (o: Order): boolean =>
  ['delivered', 'completed', 'done'].includes(o.status.toLowerCase()) && !!o.reorder_payload

export function useReorder(targetOrder?: Order) {
  const { data, isLoading } = useCustomerOrders(1)
  const { storeInfo } = useOrdering()
  const { data: menu } = useStoreMenu(storeInfo?.storeId || '')
  const { addCafeItem, clearCafeCart } = useCart()
  const navigate = useNavigate()

  const sourceOrder = useMemo(() => {
    if (targetOrder) return isReorderable(targetOrder) ? targetOrder : null
    return data?.orders?.find(isReorderable) ?? null
  }, [targetOrder, data])

  const canReorder = !!sourceOrder && !!menu

  const reorder = () => {
    const payload = sourceOrder?.reorder_payload as ReorderPayload | null | undefined
    if (!payload || !menu) return
    clearCafeCart()
    let added = 0, skipped = 0
    for (const item of payload.items) {
      const menuProduct = menu.products.find(p => p.id === item.petpooja_item_id)
      if (!menuProduct) {
        skipped++
        continue
      }
      const resolvedAddons = item.addons.flatMap(a => {
        for (const group of menuProduct.addon_groups) {
          const found = group.addons.find(ad => ad.id === a.petpooja_addon_id)
          if (found) return [{ id: found.id, name: found.name, price: found.price, groupName: group.name }]
        }
        return []
      })
      const cartItemId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `cart_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      addCafeItem({
        cartItemId,
        productId: menuProduct.id,
        productCode: item.petpooja_item_id,
        name: menuProduct.name,
        price: menuProduct.price,
        quantity: item.quantity,
        addons: resolvedAddons,
        specialInstructions: '',
      })
      added++
    }
    if (added === 0) {
      toast.error('No items from your last order are available right now.')
      return
    }
    toast.success(skipped > 0
      ? `Added ${added} items to cart. ${skipped} no longer available.`
      : `Added ${added} items to cart.`)
    navigate('/order')
  }

  return { canReorder, reorder, isLoading }
}
