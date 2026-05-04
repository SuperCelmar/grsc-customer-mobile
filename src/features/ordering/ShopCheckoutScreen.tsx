import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useCart } from '../../contexts/CartContext'
import { useCustomerProfile } from '../../hooks/useCustomerProfile'
import { api } from '../../lib/api'
import { useRazorpay } from './useRazorpay'
import { OrderProcessingOverlay } from './OrderProcessingOverlay'
import { getMissingCheckoutFields } from './checkoutValidation'

export function ShopCheckoutScreen() {
  const navigate = useNavigate()
  const location = useLocation()

  function handleBack() {
    if ((location.key ?? 'default') !== 'default') navigate(-1)
    else navigate('/order')
  }
  const { shopCart, shopSubtotalPaise, clearShopCart } = useCart()
  const { data: profile } = useCustomerProfile()
  const { open: openRazorpay } = useRazorpay()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Single address surfaced from customer profile (customer.customers.address_*).
  const profileAddress = profile?.customer.address_line1 ? profile.customer : null
  const selectedAddressId: string | null = profileAddress ? profile!.customer.id : null

  async function handlePay() {
    if (!selectedAddressId) return
    setLoading(true)
    setError(null)

    try {
      const orderResp = await api.createOnlineOrder({
        items: shopCart.map(i => ({ variant_id: i.variantId, quantity: i.quantity })),
        shipping_address_id: selectedAddressId,
      })

      await openRazorpay({
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
            if (verifyResp.status === 'paid') {
              clearShopCart()
              navigate('/orders?active=' + verifyResp.order_id)
            } else {
              setError('Payment verification failed. Please contact support.')
              setLoading(false)
            }
          } catch (err: any) {
            setError(err.message || 'Payment verification failed')
            setLoading(false)
          }
        },
        ondismiss: () => setLoading(false),
      })
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment')
      setLoading(false)
    }
  }

  if (shopCart.length === 0) {
    return (
      <div className="min-h-screen bg-white max-w-[430px] mx-auto flex flex-col">
        <ScreenHeader
          title="Checkout"
          onBack={handleBack}
        />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-[var(--text-secondary)]">Your shop cart is empty.</p>
          <button
            onClick={() => navigate('/order')}
            className="py-3 px-6 rounded-lg font-semibold text-white"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Browse Beans
          </button>
        </div>
      </div>
    )
  }

  const subtotalRupees = shopSubtotalPaise / 100

  const missingFields = getMissingCheckoutFields({ selectedAddressId })
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

  return (
    <div className="relative min-h-screen bg-[var(--muted)] max-w-[430px] mx-auto flex flex-col">
      <ScreenHeader
        title="Checkout"
        onBack={handleBack}
      />

      {loading && (
        <OrderProcessingOverlay
          intent="online-payment"
          totalLabel={`₹${subtotalRupees.toFixed(0)}+ checkout`}
          className="absolute inset-0"
        />
      )}

      <div className={`flex-1 overflow-y-auto pb-28 px-4 py-4 space-y-4 ${loading ? 'pointer-events-none opacity-60' : ''}`}>
        <div className="bg-white rounded-lg border border-[var(--card)] p-3 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text)]">Order Items</h2>
          {shopCart.map(item => (
            <div key={item.variantId} className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text)]">{item.productName}</p>
                <p className="text-xs text-[var(--text-secondary)]">{item.variantName} × {item.quantity}</p>
                {item.subscription && (
                  <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--primary)' }}>
                    ↻ Subscription — starts today · renews {item.subscription.interval_count === 1 ? `every ${item.subscription.interval}` : `every ${item.subscription.interval_count} ${item.subscription.interval}s`}
                  </p>
                )}
              </div>
              <p className="text-sm font-medium text-[var(--text)] ml-3">
                ₹{((item.pricePaise * item.quantity) / 100).toFixed(0)}
              </p>
            </div>
          ))}
        </div>

        <div id="checkout-address-section" className="bg-white rounded-lg border border-[var(--card)] p-3 space-y-2">
          <h2 className="text-sm font-semibold text-[var(--text)]">Delivery Address</h2>
          {profileAddress ? (
            <div className="text-sm text-[var(--text)]">
              <p>
                {profileAddress.address_line1}
                {profileAddress.address_line2 ? `, ${profileAddress.address_line2}` : ''}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {profileAddress.city}, {profileAddress.state} - {profileAddress.zip_code}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              No address on file. Add one in your profile to continue.
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg border border-[var(--card)] p-3 space-y-2">
          <h2 className="text-sm font-semibold text-[var(--text)]">Order Summary</h2>
          <div className="flex justify-between text-sm text-[var(--text-secondary)]">
            <span>Subtotal</span>
            <span>₹{subtotalRupees.toFixed(0)}</span>
          </div>
          <div className="flex justify-between font-semibold text-[var(--text)] pt-1 border-t border-[var(--card)]">
            <span>Total</span>
            <span>₹{subtotalRupees.toFixed(0)}</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">Shipping calculated separately</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
            {error}
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
            <span>{missingFields[0].label}</span>
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
            : `Proceed to Pay · ₹${subtotalRupees.toFixed(0)}+`
          }
        </button>
        <p className="text-xs text-center text-[var(--text-secondary)] mt-2">
          Total excludes shipping. Final amount calculated at payment.
        </p>
      </div>
    </div>
  )
}
