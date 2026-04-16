import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { useCustomerProfile } from '../../hooks/useCustomerProfile'
import { api } from '../../lib/api'
import type { PlaceOrderRequest } from '../../lib/api'

type Props = {
  onClose: () => void
  storeRestId: string
  storeId: string
  isStoreOpen: boolean
}

export function CartDrawer({ onClose, storeRestId, storeId: _storeId, isStoreOpen }: Props) {
  const navigate = useNavigate()
  const {
    items, removeItem, updateQty, clearCart, subtotal, itemCount,
    cafeCount, cafeSubtotal,
    shopCart, removeShopItem, updateShopQty, shopCount, shopSubtotalPaise,
  } = useCart()
  const { data: profile } = useCustomerProfile()

  const [activeTab, setActiveTab] = useState<'cafe' | 'shop'>(
    cafeCount > 0 ? 'cafe' : 'shop'
  )
  const [orderType, setOrderType] = useState<'P' | 'H' | 'D'>('P')
  const [paymentType, setPaymentType] = useState<'COD' | 'ONLINE' | 'CARD'>('COD')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [tableNo, setTableNo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const taxEstimate = Math.round(subtotal * 0.18)
  const total = subtotal + taxEstimate

  async function handlePlaceOrder() {
    if (itemCount === 0) return
    setLoading(true)
    setError(null)

    try {
      const customer = profile?.customer
      const payload: PlaceOrderRequest = {
        customer: {
          phone: customer?.phone || '',
          name: customer?.name || '',
          ...(orderType === 'H' && deliveryAddress.trim() ? { address: deliveryAddress.trim() } : {}),
        },
        order: {
          restID: storeRestId,
          order_type: orderType,
          payment_type: paymentType,
          total: total,
          tax_total: taxEstimate,
          discount_total: 0,
          ...(orderType === 'D' && tableNo.trim() ? { table_no: tableNo.trim() } : {}),
        },
        items: items.map(item => ({
          id: item.productCode,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          tax_percentage: 18,
          addons: item.addons.map(a => ({ id: a.id, name: a.name, price: a.price })),
        })),
      }

      const result = await api.placeOrder(payload)
      clearCart()
      onClose()
      navigate(`/orders?active=${result.order_id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (cafeCount + shopCount === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-t-2xl p-6 text-center">
          <p className="text-[var(--text-secondary)] mb-4">Your cart is empty.</p>
          <button onClick={onClose} className="text-[var(--primary)] font-medium text-sm">Browse Menu</button>
        </div>
      </div>
    )
  }

  const shopSubtotal = shopSubtotalPaise / 100

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl max-h-[92vh] flex flex-col">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-[var(--card)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">Your Cart</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] text-xl p-1">×</button>
        </div>

        <div className="flex border-b border-[var(--card)]">
          <button
            onClick={() => setActiveTab('cafe')}
            disabled={cafeCount === 0}
            className="flex-1 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-default"
            style={{
              borderBottom: activeTab === 'cafe' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'cafe' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'cafe' ? 700 : 400,
            }}
          >
            Cafe ({cafeCount})
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            disabled={shopCount === 0}
            className="flex-1 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-default"
            style={{
              borderBottom: activeTab === 'shop' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'shop' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'shop' ? 700 : 400,
            }}
          >
            Shop ({shopCount})
          </button>
        </div>

        {activeTab === 'cafe' && (
          <>
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
              {!isStoreOpen && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                  Store is currently closed. You can browse the menu but cannot place orders.
                </div>
              )}
              {items.map(item => (
                <div key={item.productId} className="border border-[var(--card)] rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text)]">{item.name}</p>
                      {item.addons.length > 0 && (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {item.addons.map(a => a.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-sm font-medium text-[var(--text)]">
                        ₹{((item.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity).toFixed(0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 border border-[var(--card)] rounded px-1 py-0.5">
                      <button
                        onClick={() => updateQty(item.productId, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-[var(--text)]"
                      >−</button>
                      <span className="text-sm text-[var(--text)] w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.productId, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-[var(--text)]"
                      >+</button>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-xs text-red-500"
                    >Remove</button>
                  </div>
                </div>
              ))}

              <div className="border-t border-[var(--card)] pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Subtotal</span><span>₹{cafeSubtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>GST (est. 18%)</span><span>₹{taxEstimate}</span>
                </div>
                <div className="flex justify-between font-semibold text-[var(--text)] pt-1 border-t border-[var(--card)]">
                  <span>Total</span><span>₹{total.toFixed(0)}</span>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">Order Type</label>
                  <div className="flex gap-2">
                    {(['P', 'H', 'D'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setOrderType(t)}
                        className="flex-1 py-2 rounded-lg border text-sm font-medium"
                        style={{
                          borderColor: orderType === t ? 'var(--primary)' : 'var(--card)',
                          backgroundColor: orderType === t ? 'var(--muted)' : 'white',
                          color: orderType === t ? 'var(--primary)' : 'var(--text)',
                        }}
                      >
                        {t === 'P' ? 'Pickup' : t === 'H' ? 'Delivery' : 'Dine In'}
                      </button>
                    ))}
                  </div>
                </div>

                {orderType === 'H' && (
                  <div>
                    <input
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      placeholder="Delivery address"
                      className="w-full border border-[var(--card)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
                    />
                    {!deliveryAddress.trim() && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1">Delivery address required</p>
                    )}
                  </div>
                )}

                {orderType === 'D' && (
                  <div>
                    <input
                      value={tableNo}
                      onChange={e => setTableNo(e.target.value)}
                      placeholder="Table number"
                      className="w-full border border-[var(--card)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
                    />
                    {!tableNo.trim() && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1">Table number required</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">Payment</label>
                  <div className="flex gap-2">
                    {(['COD', 'ONLINE', 'CARD'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setPaymentType(t)}
                        className="flex-1 py-2 rounded-lg border text-sm font-medium"
                        style={{
                          borderColor: paymentType === t ? 'var(--primary)' : 'var(--card)',
                          backgroundColor: paymentType === t ? 'var(--muted)' : 'white',
                          color: paymentType === t ? 'var(--primary)' : 'var(--text)',
                        }}
                      >
                        {t === 'COD' ? 'Cash' : t === 'ONLINE' ? 'Online' : 'Card'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-[var(--card)]">
              <button
                onClick={handlePlaceOrder}
                disabled={loading || !isStoreOpen || (orderType === 'H' && !deliveryAddress.trim()) || (orderType === 'D' && !tableNo.trim())}
                className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-50"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                {!isStoreOpen ? 'Store Closed' : loading ? 'Placing Order...' : `Place Order · ₹${total.toFixed(0)}`}
              </button>
            </div>
          </>
        )}

        {activeTab === 'shop' && (
          <>
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
              {shopCart.map(item => (
                <div key={item.variantId} className="border border-[var(--card)] rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        loading="lazy"
                        className="w-14 h-14 rounded-md object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text)]">{item.productName}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.variantName}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 border border-[var(--card)] rounded px-1 py-0.5">
                          <button
                            onClick={() => updateShopQty(item.variantId, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center text-[var(--text)]"
                          >−</button>
                          <span className="text-sm text-[var(--text)] w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateShopQty(item.variantId, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center text-[var(--text)]"
                          >+</button>
                        </div>
                        <p className="text-sm font-medium text-[var(--text)]">
                          ₹{(item.pricePaise * item.quantity / 100).toFixed(0)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeShopItem(item.variantId)}
                      className="text-xs text-red-500 flex-shrink-0"
                    >Remove</button>
                  </div>
                </div>
              ))}

              <div className="border-t border-[var(--card)] pt-3 text-sm">
                <div className="flex justify-between font-semibold text-[var(--text)]">
                  <span>Subtotal</span><span>₹{shopSubtotal.toFixed(0)}</span>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-[var(--card)]">
              <button
                onClick={() => { onClose(); navigate('/checkout/shop') }}
                disabled={shopCount === 0}
                className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-50"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                Checkout · ₹{shopSubtotal.toFixed(0)}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
