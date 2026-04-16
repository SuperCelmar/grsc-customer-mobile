import { useState } from 'react'

declare global {
  interface Window {
    Razorpay?: any
  }
}

export type RazorpayOpenOptions = {
  key: string
  order_id: string
  amount: number
  currency: 'INR'
  name?: string
  description?: string
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  handler: (response: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  }) => void
  ondismiss?: () => void
}

let scriptPromise: Promise<void> | null = null

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Razorpay script failed to load')))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Razorpay script failed to load'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

export function useRazorpay(): {
  open: (opts: RazorpayOpenOptions) => Promise<void>
  loading: boolean
  error: string | null
} {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function open(opts: RazorpayOpenOptions): Promise<void> {
    setLoading(true)
    setError(null)

    try {
      const isDev = import.meta.env.DEV && sessionStorage.getItem('grsc_dev_session') === '1'

      if (isDev) {
        await new Promise(r => setTimeout(r, 500))
        opts.handler({
          razorpay_order_id: opts.order_id,
          razorpay_payment_id: 'pay_mock123',
          razorpay_signature: 'sig_mock',
        })
        return
      }

      await loadRazorpayScript()

      const rzp = new window.Razorpay({
        key: opts.key,
        order_id: opts.order_id,
        amount: opts.amount,
        currency: opts.currency,
        name: opts.name,
        description: opts.description,
        prefill: opts.prefill,
        theme: opts.theme,
        handler: opts.handler,
        modal: {
          ondismiss: opts.ondismiss,
        },
      })

      rzp.open()
    } catch (err: any) {
      setError(err.message || 'Failed to open payment')
    } finally {
      setLoading(false)
    }
  }

  return { open, loading, error }
}
