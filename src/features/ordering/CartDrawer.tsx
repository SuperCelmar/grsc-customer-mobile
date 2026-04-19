import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import type { CartSubscription } from '../../contexts/CartContext'
import { useCustomerProfile } from '../../hooks/useCustomerProfile'
import { api } from '../../lib/api'
import type { PlaceOrderRequest } from '../../lib/api'

function cadenceLabel(sub: CartSubscription): string {
  if (sub.interval === 'month' && sub.interval_count === 1) return 'Monthly'
  if (sub.interval === 'week' && sub.interval_count === 2) return 'Every 2 weeks'
  if (sub.interval === 'week' && sub.interval_count === 1) return 'Weekly'
  return `Every ${sub.interval_count} ${sub.interval}${sub.interval_count > 1 ? 's' : ''}`
}

function SubscriptionChip({ sub }: { sub: CartSubscription }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide"
      style={{ backgroundColor: 'var(--muted)', color: 'var(--primary)', border: '1px solid var(--card)' }}
    >
      ↻ {cadenceLabel(sub)}
    </span>
  )
}

type Props = {
  onClose: () => void
  storeRestId: string
  storeId: string
  isStoreOpen: boolean
}

function GRMonogram({ size = 72 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: 'var(--muted)',
        borderRadius: 6,
        fontFamily: 'serif',
        color: 'var(--primary)',
        fontSize: Math.round(size * 0.4),
        fontWeight: 600,
        letterSpacing: 1,
      }}
    >
      GR
    </div>
  )
}

function TypePill({ kind }: { kind: 'cafe' | 'shop' }) {
  const label = kind === 'cafe' ? '🥤 Pickup' : '📦 Ship'
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-[10px] uppercase tracking-wide"
      style={{
        border: '1px solid var(--card)',
        color: 'var(--text-secondary)',
      }}
    >
      {label}
    </span>
  )
}

export function CartDrawer({ onClose, storeRestId, isStoreOpen }: Props) {
  const navigate = useNavigate()
  const {
    items, removeItem, updateQty, clearCart, itemCount,
    cafeCount, cafeSubtotal,
    shopCart, removeShopItem, updateShopQty, shopCount, shopSubtotalPaise,
  } = useCart()
  const { data: profile } = useCustomerProfile()

  // Pickup-only for v1 — selector UI hidden, state kept for payload shape
  const [orderType] = useState<'P' | 'H' | 'D'>('P')
  const [paymentType, setPaymentType] = useState<'COD' | 'ONLINE' | 'CARD'>('COD')
  const [promoCode, setPromoCode] = useState('')
  const [promoError, setPromoError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const taxEstimate = Math.round(cafeSubtotal * 0.18)
  const cafeTotal = cafeSubtotal + taxEstimate
  const shopSubtotal = shopSubtotalPaise / 100
  const grandTotal = cafeTotal + shopSubtotal

  function handleApplyPromo() {
    // TODO: wire to loyalty-redeem edge function
    setPromoError('Promo system coming soon.')
  }

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
        },
        order: {
          restID: storeRestId,
          order_type: orderType,
          payment_type: paymentType,
          total: cafeTotal,
          tax_total: taxEstimate,
          discount_total: 0,
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to place order. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (cafeCount + shopCount === 0) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-t-2xl p-6 text-center">
          <p className="text-[var(--text-secondary)] mb-4">Your cart is empty.</p>
          <button onClick={onClose} className="text-[var(--primary)] font-medium text-sm">Browse Menu</button>
        </div>
      </div>
    )
  }

  const isMixed = cafeCount > 0 && shopCount > 0
  const isCafeOnly = cafeCount > 0 && shopCount === 0
  const isShopOnly = cafeCount === 0 && shopCount > 0

  let ctaLabel: string
  let ctaOnClick: () => void
  let ctaDisabled = loading

  if (isCafeOnly) {
    ctaLabel = !isStoreOpen
      ? 'Store Closed'
      : loading
        ? 'Placing Order...'
        : `Place Order · ₹${cafeTotal.toFixed(0)}`
    ctaOnClick = handlePlaceOrder
    ctaDisabled = loading || !isStoreOpen
  } else if (isShopOnly) {
    ctaLabel = `Proceed to Pay · ₹${shopSubtotal.toFixed(0)}+`
    ctaOnClick = () => { onClose(); navigate('/checkout/shop') }
  } else {
    // mixed
    ctaLabel = !isStoreOpen
      ? 'Cafe Closed'
      : `Checkout · ₹${grandTotal.toFixed(0)}+`
    ctaOnClick = () => { onClose(); navigate('/checkout') }
    ctaDisabled = loading || !isStoreOpen
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl max-h-[92vh] flex flex-col">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-[var(--card)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">Your Cart</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-[var(--text-secondary)] text-xl p-1 disabled:opacity-40"
          >×</button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
          {cafeCount > 0 && !isStoreOpen && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {isMixed
                ? 'Cafe is currently closed. Remove cafe items to proceed with shop only, or retry later.'
                : 'Store is currently closed. You can browse the menu but cannot place orders.'}
            </div>
          )}

          {items.map(item => (
            <div key={item.cartItemId} className="relative border border-[var(--card)] rounded-lg p-3">
              <button
                onClick={() => removeItem(item.cartItemId)}
                disabled={loading}
                aria-label={`Remove ${item.name}`}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] disabled:opacity-40"
                style={{ fontSize: 18, lineHeight: 1 }}
              >×</button>
              <div className="flex items-start gap-3">
                <GRMonogram size={72} />
                <div className="flex-1 min-w-0 pr-6">
                  <div className="mb-1"><TypePill kind="cafe" /></div>
                  <p className="text-sm font-medium text-[var(--text)]">{item.name}</p>
                  {item.addons.length > 0 && (
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {item.addons.map(a => a.name).join(', ')}
                    </p>
                  )}
                  <p className="text-sm font-medium text-[var(--text)] mt-1">
                    ₹{((item.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity).toFixed(0)}
                  </p>
                  <div className="flex items-center mt-2">
                    <div className="flex items-center gap-2 border border-[var(--card)] rounded px-1 py-0.5">
                      <button
                        onClick={() => updateQty(item.cartItemId, item.quantity - 1)}
                        disabled={loading}
                        className="w-6 h-6 flex items-center justify-center text-[var(--text)] disabled:opacity-40"
                      >−</button>
                      <span className="text-sm text-[var(--text)] w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.cartItemId, item.quantity + 1)}
                        disabled={loading}
                        className="w-6 h-6 flex items-center justify-center text-[var(--text)] disabled:opacity-40"
                      >+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {shopCart.map(item => (
            <div key={item.variantId} className="relative border border-[var(--card)] rounded-lg p-3">
              <button
                onClick={() => removeShopItem(item.variantId)}
                disabled={loading}
                aria-label={`Remove ${item.productName}`}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] disabled:opacity-40"
                style={{ fontSize: 18, lineHeight: 1 }}
              >×</button>
              <div className="flex items-start gap-3">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    loading="lazy"
                    className="flex-shrink-0 object-cover"
                    style={{ width: 72, height: 72, borderRadius: 6 }}
                  />
                ) : (
                  <GRMonogram size={72} />
                )}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="mb-1 flex items-center gap-1.5 flex-wrap">
                    <TypePill kind="shop" />
                    {item.subscription && <SubscriptionChip sub={item.subscription} />}
                  </div>
                  <p className="text-sm font-semibold text-[var(--text)]">{item.productName}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.variantName}</p>
                  <p className="text-sm font-medium text-[var(--text)] mt-1">
                    ₹{(item.pricePaise * item.quantity / 100).toFixed(0)}
                  </p>
                  <div className="flex items-center mt-2">
                    <div className="flex items-center gap-2 border border-[var(--card)] rounded px-1 py-0.5">
                      <button
                        onClick={() => updateShopQty(item.variantId, item.quantity - 1)}
                        disabled={loading}
                        className="w-6 h-6 flex items-center justify-center text-[var(--text)] disabled:opacity-40"
                      >−</button>
                      <span className="text-sm text-[var(--text)] w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateShopQty(item.variantId, item.quantity + 1)}
                        disabled={loading}
                        className="w-6 h-6 flex items-center justify-center text-[var(--text)] disabled:opacity-40"
                      >+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="border-t border-[var(--card)] pt-3 space-y-1 text-sm">
            {cafeCount > 0 && (
              <>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Pickup subtotal</span><span>₹{cafeSubtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Tax & Service (18%)</span><span>₹{taxEstimate}</span>
                </div>
              </>
            )}
            {shopCount > 0 && (
              <>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Shipped subtotal</span><span>₹{shopSubtotal.toFixed(0)}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">Shipping calculated at payment</p>
              </>
            )}
            <div className="flex justify-between font-semibold text-[var(--text)] pt-1 border-t border-[var(--card)]">
              <span>Total now</span>
              <span>₹{grandTotal.toFixed(0)}{shopCount > 0 ? '+' : ''}</span>
            </div>
          </div>

          {cafeCount > 0 && (
            <>
              {/* Promo code — UI only (stubbed). TODO: wire to loyalty-redeem edge function */}
              <div className="pt-2">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">
                  Have a Promo Code?
                </label>
                <div className="flex gap-2">
                  <input
                    value={promoCode}
                    onChange={e => { setPromoCode(e.target.value); setPromoError(null) }}
                    placeholder="Enter code"
                    className="flex-1 border border-[var(--card)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-4 py-2 rounded-lg border text-sm font-medium"
                    style={{
                      borderColor: 'var(--card)',
                      color: 'var(--text)',
                      backgroundColor: 'white',
                    }}
                  >
                    Apply
                  </button>
                </div>
                {promoError && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5">{promoError}</p>
                )}
              </div>

              {isCafeOnly && (
                <div className="pt-2 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">Payment</label>
                    <div className="flex gap-2">
                      {(['COD', 'ONLINE', 'CARD'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setPaymentType(t)}
                          disabled={loading}
                          className="flex-1 py-2 rounded-lg border text-sm font-medium disabled:opacity-40"
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
              )}
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-[var(--card)]">
          <button
            onClick={ctaOnClick}
            disabled={ctaDisabled}
            className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-50"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
