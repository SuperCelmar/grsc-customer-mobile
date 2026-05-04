import { supabase } from '../../../lib/supabase'

export interface OrderSnapshot {
  fulfillment_status: string
  source_order_id: string | null
  payment_status: string | null
  order_fulfillment_events: { id: string; to_state: string; created_at: string }[]
  // enrichment fields present only when fetched from the confirmation route
  total_amount?: number | null
  store_name?: string | null
}

const RETRY_DELAYS_MS = [400, 800, 1600]

/**
 * Fetch an order snapshot from the `customer-orders` edge function, retrying up
 * to 3 times to absorb replica lag (the same pattern used previously when this
 * read hit Supabase directly).
 *
 * Retry semantics:
 * - HTTP 404 from the edge fn -> treat as "not yet propagated" and retry.
 * - `data === null` with no error -> retry (preserved for safety; edge fn
 *   should normally throw or return data).
 * - Any other error -> terminal; return null.
 *
 * Returns null only after all attempts fail to produce data.
 */
export async function fetchOrderWithRetry(orderId: string): Promise<OrderSnapshot | null> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    // TODO(multischema-adapt Step 4): requires customer-orders edge fn extended
    // with `include_events` flag returning nested order_fulfillment_events. Confirm
    // contract with backend before merge. Plan §Step 1 check 3.
    const { data, error } = await supabase.functions.invoke<OrderSnapshot>('customer-orders', {
      body: { order_id: orderId, include_events: true },
    })

    if (error) {
      // Treat HTTP 404 as the replica-lag retry case; any other error is terminal.
      const status = (error as { context?: { status?: number } } | null)?.context?.status
      if (status !== 404) {
        return null
      }
    } else if (data) {
      return data as OrderSnapshot
    }

    if (attempt < RETRY_DELAYS_MS.length) {
      await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
    }
  }
  return null
}
