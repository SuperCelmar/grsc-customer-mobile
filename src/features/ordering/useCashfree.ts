import { useState } from 'react'

declare global {
  interface Window {
    Cashfree?: (config: { mode: 'sandbox' | 'production' }) => CashfreeInstance
  }
}

type CashfreeInstance = {
  checkout: (opts: { paymentSessionId: string; redirectTarget?: string }) => Promise<{ error?: { message: string }; redirect?: boolean }>
}

export type CashfreeOpenOptions = {
  payment_session_id: string
  order_id: string
  onSuccess: (orderId: string) => void
  onFailure: (message: string) => void
}

let scriptPromise: Promise<void> | null = null

function loadCashfreeScript(): Promise<void> {
  if (window.Cashfree) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[src*="cashfree"]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Cashfree script failed to load')))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Cashfree script failed to load'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

export function useCashfree(): {
  open: (opts: CashfreeOpenOptions) => Promise<void>
  loading: boolean
  error: string | null
} {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function open(opts: CashfreeOpenOptions): Promise<void> {
    setLoading(true)
    setError(null)

    try {
      // No dev short-circuit: we always open the real Cashfree SDK so the
      // full payment flow (modal, card/UPI entry, webhook) is exercised even
      // when the rest of the app is in grsc_dev_session mock mode.
      await loadCashfreeScript()

      const mode = (import.meta.env.VITE_CASHFREE_ENV || 'sandbox') as 'sandbox' | 'production'
      const cf = window.Cashfree!({ mode })

      const result = await cf.checkout({
        paymentSessionId: opts.payment_session_id,
        redirectTarget: '_modal',
      })

      if (result.error) {
        opts.onFailure(result.error.message || 'Payment failed')
      } else {
        opts.onSuccess(opts.order_id)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to open payment'
      setError(msg)
      opts.onFailure(msg)
    } finally {
      setLoading(false)
    }
  }

  return { open, loading, error }
}
