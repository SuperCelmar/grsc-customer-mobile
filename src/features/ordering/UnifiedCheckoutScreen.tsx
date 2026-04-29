import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCart } from '../../contexts/CartContext'
import { useCustomerProfile, useStoreStatus } from '../../hooks/useCustomerProfile'
import { useOrdering } from './OrderingContext'
import { api } from '../../lib/api'
import type { CustomerAddress, LoyaltyReward, PlaceOrderRequest } from '../../lib/api'
import { useRazorpay } from './useRazorpay'
import { useCashfree } from './useCashfree'
import { AddressBottomSheet } from './AddressBottomSheet'
import { getMissingCheckoutFields } from './checkoutValidation'
import { RewardPicker } from '../orders/RewardPicker'

type PaymentResult = { shopOrderId: string } | { cancelled: true }

const enabledProviders = (import.meta.env.VITE_PAYMENT_PROVIDERS || 'razorpay')
  .split(',').map((s: string) => s.trim()).filter(Boolean) as string[]
const defaultProvider = (import.meta.env.VITE_DEFAULT_PAYMENT_PROVIDER || enabledProviders[0] || 'razorpay') as string

export function UnifiedCheckoutScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()

  const {
    items: cafeCart,
    cafeCount,
    cafeSubtotal,
    shopCart,
    shopCount,
    shopSubtotalPaise,
    clearCafeCart,
    clearShopCart,
  } = useCart()
  const { data: profile } = useCustomerProfile()
  const { storeInfo } = useOrdering()
  const restID = storeInfo?.petpoojaRestaurantId ?? ''
  const { data: storeStatus } = useStoreStatus(restID)
  const isStoreOpen = storeStatus?.store_status !== '0'
  const { open: openRazorpay } = useRazorpay()
  const { open: openCashfree } = useCashfree()

  const [selectedProvider, setSelectedProvider] = useState<string>(defaultProvider)
  const [manualAddressId, setManualAddressId] = useState<string | null>(null)
  const [showAddressSheet, setShowAddressSheet] = useState(false)
  const [paymentType, setPaymentType] = useState<'COD' | 'ONLINE' | 'CARD'>('ONLINE')
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null)
  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)

  const { data: addresses = [], isLoading: addressesLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: api.listAddresses,
  })

  const defaultAddressId = addresses.length > 0
    ? (addresses.find(a => a.is_default) ?? addresses[0]).address_id
    : null
  const selectedAddressId = manualAddressId ?? defaultAddressId
  const setSelectedAddressId = setManualAddressId

  const taxEstimate = Math.round(cafeSubtotal * 0.18)
  const cafeTotal = cafeSubtotal + taxEstimate
  const rewardDiscount = selectedReward
    ? Math.min(selectedReward.cashback?.maxRedeemableNow ?? 0, cafeTotal)
    : 0
  const payableCafeTotal = Math.max(0, cafeTotal - rewardDiscount)
  const shopSubtotal = shopSubtotalPaise / 100
  const grandTotal = payableCafeTotal + shopSubtotal

  const missingFields = getMissingCheckoutFields({
    selectedAddressId,
    isStoreOpen,
    hasCafeItems: cafeCount > 0,
  })
  const hasMissing = missingFields.length > 0

  function handleCtaClick() {
    if (loading) return
    if (hasMissing) {
      const first = missingFields[0]
      toast.error(first.label)
      document.getElementById(first.sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    handlePay()
  }

  function handleBack() {
    if ((location.key ?? 'default') !== 'default') navigate(-1)
    else navigate('/order')
  }

  function handleAddressAdded(address: CustomerAddress) {
    qc.invalidateQueries({ queryKey: ['addresses'] })
    setSelectedAddressId(address.address_id)
    setShowAddressSheet(false)
  }

  function payShopWithRazorpay(): Promise<PaymentResult> {
    return new Promise<PaymentResult>((resolve, reject) => {
      if (!selectedAddressId) {
        reject(new Error('Select a delivery address first'))
        return
      }
      let settled = false

      api.createOnlineOrder({
        items: shopCart.map(i => ({ variant_id: i.variantId, quantity: i.quantity })),
        shipping_address_id: selectedAddressId,
      })
        .then(orderResp => {
          return openRazorpay({
            key: orderResp.razorpay_key_id,
            order_id: orderResp.razorpay_order_id,
            amount: orderResp.amount_paise,
            currency: 'INR',
            name: 'GoldRush',
            prefill: {
              contact: profile?.customer.phone,
              name: profile?.customer.name ?? undefined,
            },
            theme: { color: '#D4A574' },
            handler: async (resp) => {
              try {
                const verifyResp = await api.verifyRazorpayPayment({
                  razorpay_order_id: resp.razorpay_order_id,
                  razorpay_payment_id: resp.razorpay_payment_id,
                  razorpay_signature: resp.razorpay_signature,
                })
                if (settled) return
                settled = true
                if (verifyResp.status === 'paid') {
                  resolve({ shopOrderId: verifyResp.order_id })
                } else {
                  reject(new Error('Payment verification failed'))
                }
              } catch (err) {
                if (settled) return
                settled = true
                reject(err instanceof Error ? err : new Error('Payment verification failed'))
              }
            },
            ondismiss: () => {
              if (settled) return
              settled = true
              resolve({ cancelled: true })
            },
          })
        })
        .catch(err => {
          if (settled) return
          settled = true
          reject(err instanceof Error ? err : new Error('Failed to initiate payment'))
        })
    })
  }

  function payShopWithCashfree(): Promise<PaymentResult> {
    return new Promise<PaymentResult>((resolve, reject) => {
      if (!selectedAddressId) {
        reject(new Error('Select a delivery address first'))
        return
      }

      api.createCashfreeOrder({
        items: shopCart.map(i => ({ variant_id: i.variantId, quantity: i.quantity })),
        shipping_address_id: selectedAddressId,
      })
        .then(orderResp => {
          return openCashfree({
            payment_session_id: orderResp.payment_session_id,
            order_id: orderResp.order_id,
            onSuccess: (orderId) => resolve({ shopOrderId: orderId }),
            onFailure: (message) => reject(new Error(message)),
          })
        })
        .catch(err => {
          reject(err instanceof Error ? err : new Error('Failed to initiate payment'))
        })
    })
  }

  function payShop(): Promise<PaymentResult> {
    if (selectedProvider === 'cashfree') return payShopWithCashfree()
    return payShopWithRazorpay()
  }

  function buildCafePayload(): PlaceOrderRequest {
    const customer = profile?.customer
    return {
      customer: {
        phone: customer?.phone || '',
        name: customer?.name || '',
      },
      order: {
        restID: storeInfo?.petpoojaRestaurantId ?? '',
        order_type: 'P',
        payment_type: paymentType,
        total: payableCafeTotal,
        tax_total: taxEstimate,
        discount_total: rewardDiscount,
      },
      items: cafeCart.map(item => ({
        id: item.productCode,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        tax_percentage: 18,
        addons: item.addons.map(a => ({ id: a.id, name: a.name, price: a.price, group_name: a.groupName ?? '' })),
      })),
    }
  }

  async function handlePay() {
    if (loading) return
    if (!isStoreOpen) {
      setBanner('Cafe is closed — remove cafe items to proceed with shop only.')
      return
    }
    if (!selectedAddressId) {
      setBanner('Please select a delivery address.')
      return
    }
    setLoading(true)
    setBanner(null)

    try {
      const razorpayResult = await payShop()

      if ('cancelled' in razorpayResult) {
        setBanner('Payment not completed.')
        setLoading(false)
        return
      }

      const { shopOrderId } = razorpayResult

      let cafeOrderId: string | null = null
      try {
        const cafePayload = buildCafePayload()

        if (paymentType !== 'COD') {
          // Online cafe payment — open a second Cashfree session for the cafe portion.
          let order_id: string
          let payment_session_id: string
          try {
            ;({ order_id, payment_session_id } = await api.createCashfreeCafeOrder(cafePayload))
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Payment could not be started'
            console.error('cashfree-cafe: session creation failed', { phase: 'cashfree-cafe', err })
            toast.error(msg)
            throw err
          }
          await new Promise<void>((resolve, reject) => {
            openCashfree({
              payment_session_id,
              order_id,
              onSuccess: (paidId) => { cafeOrderId = paidId; resolve() },
              onFailure: (msg) => {
                console.error('cashfree-cafe: payment failure', { phase: 'openCashfree', order_id, payment_session_id, msg })
                toast.error(msg || 'Cafe payment could not be completed')
                reject(new Error(msg))
              },
            }).catch(reject)
          })
        } else {
          // COD — place via external-order as before.
          const res = await api.placeOrder(cafePayload)
          cafeOrderId = res.order_id
        }

        if (cafeOrderId && selectedReward && profile?.customer.id && rewardDiscount > 0) {
          try {
            await api.redeemReward({
              customerId: profile.customer.id,
              rewardId: selectedReward.id,
              orderId: cafeOrderId,
              amountToRedeem: rewardDiscount,
            })
          } catch (redeemErr) {
            const msg = redeemErr instanceof Error ? redeemErr.message : 'Reward could not be applied'
            toast.error(`Order placed but reward failed: ${msg}`)
          }
        }
        clearCafeCart()
        clearShopCart()
      } catch {
        // Shop already paid; keep cafe cart for retry.
        clearShopCart()
        setBanner(paymentType === 'COD'
          ? 'Shop paid. Cafe order failed — retry from Orders.'
          : 'Shop paid. Cafe payment failed — retry from Orders.')
      }

      qc.invalidateQueries({ queryKey: ['customer-orders'] })

      const UUID_RE = /^[0-9a-f-]{36}$/
      const isValidId = (id: string | null | undefined): id is string => !!id && UUID_RE.test(id)
      if (isValidId(cafeOrderId) && isValidId(shopOrderId)) {
        // Cafe is the primary for the confirmation page; shop is secondary chip
        navigate(`/order-confirmation/${cafeOrderId}?secondary=${shopOrderId}`)
      } else if (isValidId(cafeOrderId)) {
        navigate(`/order-confirmation/${cafeOrderId}`)
      } else if (isValidId(shopOrderId)) {
        navigate(`/order-confirmation/${shopOrderId}`)
      } else {
        console.error('checkout: no valid order IDs to navigate to', { shopOrderId, cafeOrderId })
        navigate('/orders')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed'
      setBanner(msg)
      setLoading(false)
    }
  }

  // If cart composition ever becomes non-mixed (e.g. user removed items elsewhere),
  // redirect away from the unified checkout.
  useEffect(() => {
    if (cafeCount === 0 && shopCount === 0) {
      navigate('/order', { replace: true })
    } else if (cafeCount === 0 && shopCount > 0) {
      navigate('/checkout/shop', { replace: true })
    }
  }, [cafeCount, shopCount, navigate])

  if (cafeCount === 0 || shopCount === 0) {
    // Guarded by the effect above; render nothing during the redirect.
    return null
  }

  const selectedAddress = addresses.find(a => a.address_id === selectedAddressId) ?? null

  return (
    <div className="min-h-screen bg-[var(--muted)] max-w-[430px] mx-auto flex flex-col">
      <ScreenHeader
        title="Checkout"
        onBack={handleBack}
      />

      <div className={`flex-1 overflow-y-auto pb-28 px-4 py-4 space-y-4 ${loading ? 'pointer-events-none opacity-60' : ''}`}>
        {!isStoreOpen && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
            Cafe is currently closed. Remove cafe items to continue with shop only.
          </div>
        )}

        {/* Ship section */}
        <section id="checkout-address-section" className="bg-white rounded-lg border border-[var(--card)] p-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">📦 Ship</span>
            <h2 className="text-sm font-semibold text-[var(--text)]">Shipped items</h2>
          </div>

          <div className="space-y-2">
            {shopCart.map(item => (
              <div key={item.variantId} className="flex items-start justify-between">
                <div className="flex-1 pr-3">
                  <p className="text-sm font-medium text-[var(--text)]">{item.productName}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{item.variantName} × {item.quantity}</p>
                  {item.subscription && (
                    <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--primary)' }}>
                      ↻ Subscription — starts today · renews {item.subscription.interval_count === 1 ? `every ${item.subscription.interval}` : `every ${item.subscription.interval_count} ${item.subscription.interval}s`}
                    </p>
                  )}
                </div>
                <p className="text-sm font-medium text-[var(--text)]">
                  ₹{((item.pricePaise * item.quantity) / 100).toFixed(0)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--card)] pt-2 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text)]">Delivery Address</h3>
              <button
                onClick={() => setShowAddressSheet(true)}
                disabled={loading}
                className="text-xs font-medium disabled:opacity-40"
                style={{ color: 'var(--primary)' }}
              >
                {selectedAddress ? 'Change' : '+ Add new address'}
              </button>
            </div>

            {addressesLoading ? (
              <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--primary)] border-t-transparent" />
              </div>
            ) : addresses.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No saved addresses. Please add one.</p>
            ) : selectedAddress ? (
              <div className="text-sm text-[var(--text)]">
                {selectedAddress.label && (
                  <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                    {selectedAddress.label}
                  </p>
                )}
                <p>{selectedAddress.line1}{selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {addresses.map(addr => (
                  <label
                    key={addr.address_id}
                    className="flex items-start gap-3 p-2 rounded-lg border cursor-pointer"
                    style={{
                      borderColor: 'var(--card)',
                      backgroundColor: 'white',
                    }}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr.address_id}
                      checked={false}
                      onChange={() => setSelectedAddressId(addr.address_id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-[var(--text)]">{addr.line1}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {enabledProviders.length > 1 && (
            <div className="border-t border-[var(--card)] pt-2">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">Payment Provider</label>
              <div className="flex gap-2">
                {enabledProviders.map(p => (
                  <button
                    key={p}
                    onClick={() => setSelectedProvider(p)}
                    disabled={loading}
                    data-testid={`provider-${p}`}
                    className="flex-1 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 capitalize"
                    style={{
                      borderColor: selectedProvider === p ? 'var(--primary)' : 'var(--card)',
                      backgroundColor: selectedProvider === p ? 'var(--muted)' : 'white',
                      color: selectedProvider === p ? 'var(--primary)' : 'var(--text)',
                    }}
                  >
                    {p === 'razorpay' ? 'Razorpay' : 'Cashfree'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-[var(--card)] pt-2 flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Shipped subtotal</span>
            <span className="font-medium text-[var(--text)]">₹{shopSubtotal.toFixed(0)}</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">Final amount includes shipping, calculated at payment.</p>
        </section>

        {/* Pickup section */}
        <section id="checkout-pickup-section" className="bg-white rounded-lg border border-[var(--card)] p-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">🥤 Pickup</span>
            <h2 className="text-sm font-semibold text-[var(--text)]">Pickup items</h2>
          </div>

          <div className="space-y-2">
            {cafeCart.map(item => {
              const lineTotal = (item.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity
              return (
                <div key={item.cartItemId} className="flex items-start justify-between">
                  <div className="flex-1 pr-3">
                    <p className="text-sm font-medium text-[var(--text)]">{item.name} × {item.quantity}</p>
                    {item.addons.length > 0 && (
                      <p className="text-xs text-[var(--text-secondary)]">
                        {item.addons.map(a => a.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[var(--text)]">₹{lineTotal.toFixed(0)}</p>
                </div>
              )
            })}
          </div>

          <div className="border-t border-[var(--card)] pt-2 space-y-1">
            <div className="flex justify-between text-sm text-[var(--text-secondary)]">
              <span>Subtotal</span><span>₹{cafeSubtotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm text-[var(--text-secondary)]">
              <span>Tax & Service (18%)</span><span>₹{taxEstimate}</span>
            </div>
            {rewardDiscount > 0 && (
              <div className="flex justify-between text-sm" style={{ color: '#6B8E23' }}>
                <span>{selectedReward?.name ?? 'Reward'}</span>
                <span>−₹{rewardDiscount.toFixed(0)}</span>
              </div>
            )}
          </div>

          {profile?.customer.id && (
            <RewardPicker
              customerId={profile.customer.id}
              orderAmount={cafeTotal}
              selectedRewardId={selectedReward?.id ?? null}
              onSelect={setSelectedReward}
            />
          )}

          <div className="border-t border-[var(--card)] pt-2">
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
        </section>

        {/* Totals */}
        <section className="bg-white rounded-lg border border-[var(--card)] p-3 space-y-1 text-sm">
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Pickup total</span><span>₹{payableCafeTotal.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Shipped subtotal</span><span>₹{shopSubtotal.toFixed(0)}</span>
          </div>
          <div className="flex justify-between font-semibold text-[var(--text)] pt-1 border-t border-[var(--card)]">
            <span>Total now</span><span>₹{grandTotal.toFixed(0)}+</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">Shipping added at payment.</p>
        </section>

        {banner && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
            {banner}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-[var(--card)] px-4 py-3">
        {hasMissing && !loading && (
          <div
            id="checkout-hint"
            role="status"
            aria-live="polite"
            className="mb-2 px-3 py-2 rounded-lg text-xs flex items-start gap-2"
            style={{ backgroundColor: 'var(--muted)', color: 'var(--text-secondary)' }}
          >
            <span aria-hidden="true">⚠️</span>
            <span>
              {missingFields.length === 1
                ? missingFields[0].label
                : `To continue: ${missingFields.map(f => f.label).join(' · ')}`}
            </span>
          </div>
        )}
        <button
          onClick={handleCtaClick}
          disabled={loading}
          aria-disabled={hasMissing}
          aria-describedby={hasMissing ? 'checkout-hint' : undefined}
          className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-50"
          style={{ backgroundColor: 'var(--primary)', opacity: hasMissing && !loading ? 0.5 : undefined }}
        >
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Processing...
              </span>
            : `Pay · ₹${grandTotal.toFixed(0)}+`}
        </button>
        <p className="text-xs text-center text-[var(--text-secondary)] mt-2">
          Payment first, then we'll submit your cafe order.
        </p>
      </div>

      {showAddressSheet && (
        <AddressBottomSheet
          onSelected={handleAddressAdded}
          onCancel={() => setShowAddressSheet(false)}
        />
      )}
    </div>
  )
}
