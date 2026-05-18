import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ProductImage } from '../../components/ProductImage'
import { useCart } from '../../contexts/CartContext'
import type { CartSubscription } from '../../contexts/CartContext'
import { useCustomerProfile } from '../../hooks/useCustomerProfile'
import { api } from '../../lib/api'
import type { LoyaltyReward, PlaceOrderRequest } from '../../lib/api'
import { RewardPicker } from '../orders/RewardPicker'
import { OrderProcessingOverlay } from './OrderProcessingOverlay'
import { useCashfree } from './useCashfree'
import { cartHash, clearSessionByOrderId, loadSession, saveSession } from './useCashfreeSession'

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
  const { open: openCashfree } = useCashfree()

  // Pickup-only for v1 — selector UI hidden, state kept for payload shape
  const [orderType] = useState<'P' | 'H' | 'D'>('P')
  const [paymentType, setPaymentType] = useState<'COD' | 'ONLINE'>('COD')
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const taxEstimate = Math.round(cafeSubtotal * 0.18)
  const cafeTotal = cafeSubtotal + taxEstimate
  const rewardDiscount = selectedReward
    ? Math.min(selectedReward.cashback?.maxRedeemableNow ?? 0, cafeTotal)
    : 0
  const payableCafeTotal = Math.max(0, cafeTotal - rewardDiscount)
  const shopSubtotal = shopSubtotalPaise / 100
  const grandTotal = payableCafeTotal + shopSubtotal

  async function handlePlaceOrder() {
    if (itemCount === 0) return
    setLoading(true)
    setError(null)

    try {
      const customer = profile?.customer
      if (!customer?.phone) {
        setError('Your phone number is missing from your profile. Sign out and sign in again with phone OTP.')
        setLoading(false)
        return
      }
      const payload: PlaceOrderRequest = {
        customer: {
          phone: customer.phone,
          name: customer?.name || '',
        },
        order: {
          restID: storeRestId,
          order_type: orderType,
          payment_type: paymentType,
          total: payableCafeTotal,
          tax_total: taxEstimate,
          discount_total: rewardDiscount,
        },
        items: items.map(item => ({
          id: item.productCode,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          tax_percentage: 18,
          addons: item.addons.map(a => ({ id: a.id, name: a.name, price: a.price, group_name: a.groupName ?? '' })),
        })),
      }

      // For cafe-only orders with online payment, route through Cashfree.
      // Cafe COD uses api.placeOrder, backed by online-order-create's cafe branch.
      if (isCafeOnly && paymentType !== 'COD') {
        try {
          const phone = customer?.phone || ''
          const hash = cartHash(items)

          // Idempotency: reuse an existing non-expired session for the same cart
          const existing = phone ? loadSession(phone) : null
          const sessionToUse = existing?.cart_hash === hash ? existing : null

          let order_id: string
          let payment_session_id: string

          if (sessionToUse) {
            order_id = sessionToUse.order_id
            payment_session_id = sessionToUse.payment_session_id
          } else {
            const created = await api.createCashfreeCafeOrder(payload)
            order_id = created.order_id
            payment_session_id = created.payment_session_id
            if (phone) saveSession(phone, { order_id, payment_session_id, cart_hash: hash })
          }

          await openCashfree({
            payment_session_id,
            order_id,
            onSuccess: async (paidOrderId) => {
              const UUID_RE = /^[0-9a-f-]{36}$/
              if (!paidOrderId || !UUID_RE.test(paidOrderId)) {
                console.error('cashfree-cafe: invalid paidOrderId', { paidOrderId })
                toast.error('Payment succeeded but order ID is invalid — check Orders tab.')
                clearCart()
                onClose()
                return
              }
              if (phone) clearSessionByOrderId(paidOrderId)
              if (selectedReward && customer?.id) {
                try {
                  await api.redeemReward({
                    customerId: customer.id,
                    rewardId: selectedReward.id,
                    orderId: paidOrderId,
                    amountToRedeem: rewardDiscount,
                  })
                } catch (redeemErr) {
                  const msg = redeemErr instanceof Error ? redeemErr.message : 'Reward could not be applied'
                  toast.error(`Order placed but reward failed: ${msg}`)
                }
              }
              clearCart()
              onClose()
              navigate(`/orders?active=${paidOrderId}`)
            },
            onFailure: (msg) => {
              console.error('cashfree-cafe: payment failure', { phase: 'openCashfree', order_id, payment_session_id, msg })
              toast.error(msg || 'Payment could not be completed')
              setError(msg || 'Payment could not be completed')
            },
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Payment could not be started'
          console.error('cashfree-cafe: session creation failed', { phase: 'cashfree-cafe', err })
          toast.error(msg)
          setError(msg)
        }
        return
      }

      const result = await api.placeOrder(payload)

      if (selectedReward && customer?.id) {
        try {
          await api.redeemReward({
            customerId: customer.id,
            rewardId: selectedReward.id,
            orderId: result.order_id,
            amountToRedeem: rewardDiscount,
          })
        } catch (redeemErr) {
          const msg = redeemErr instanceof Error ? redeemErr.message : 'Reward could not be applied'
          toast.error(`Order placed but reward failed: ${msg}`)
        }
      }

      clearCart()
      onClose()
      const UUID_RE = /^[0-9a-f-]{36}$/
      if (result.order_id && UUID_RE.test(result.order_id)) {
        navigate(`/orders?active=${result.order_id}`)
      } else {
        console.error('place-order: invalid order_id', { order_id: result.order_id })
        navigate('/orders')
      }
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
  const processingIntent = paymentType === 'COD' ? 'cash-order' : 'online-payment'

  let ctaLabel: string
  let ctaOnClick: () => void
  let ctaDisabled = loading

  if (isCafeOnly) {
    ctaLabel = !isStoreOpen
      ? 'Store Closed'
      : loading
        ? paymentType === 'COD' ? 'Sending Order...' : 'Starting Payment...'
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
      <div
        className="absolute inset-0 bg-black/40"
        onClick={loading ? undefined : onClose}
      />
      <div className="relative bg-white rounded-t-2xl max-h-[92vh] flex flex-col">
        {loading && (
          <OrderProcessingOverlay
            intent={processingIntent}
            totalLabel={`₹${payableCafeTotal.toFixed(0)} pickup`}
            className="absolute inset-0 rounded-t-2xl"
          />
        )}
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
                <ProductImage src={item.imageUrl ?? null} alt={item.name} />
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
                <ProductImage src={item.imageUrl} alt={item.productName} />
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
                {rewardDiscount > 0 && (
                  <div className="flex justify-between" style={{ color: '#6B8E23' }}>
                    <span>{selectedReward?.name ?? 'Reward'}</span>
                    <span>−₹{rewardDiscount.toFixed(0)}</span>
                  </div>
                )}
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
              {profile?.customer.id && (
                <RewardPicker
                  customerId={profile.customer.id}
                  orderAmount={cafeTotal}
                  selectedRewardId={selectedReward?.id ?? null}
                  onSelect={setSelectedReward}
                />
              )}

              {isCafeOnly && (
                <div className="pt-2 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">Payment</label>
                    <div className="flex gap-2">
                      {(['COD', 'ONLINE'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setPaymentType(t)}
                          disabled={loading}
                          aria-label={t === 'ONLINE' ? 'Online payment' : undefined}
                          aria-pressed={paymentType === t}
                          className="flex-1 py-2 rounded-lg border text-sm font-medium disabled:opacity-40"
                          style={{
                            borderColor: paymentType === t ? 'var(--primary)' : 'var(--card)',
                            backgroundColor: paymentType === t ? 'var(--muted)' : 'white',
                            color: paymentType === t ? 'var(--primary)' : 'var(--text)',
                          }}
                        >
                          {t === 'COD' ? 'Pay at Store' : 'Pay Now'}
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
