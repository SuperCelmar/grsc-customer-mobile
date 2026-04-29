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
 * Fetch an order row from Supabase, retrying up to 3 times to absorb replica lag.
 * Returns null only after all attempts return null.
 */
export async function fetchOrderWithRetry(orderId: string): Promise<OrderSnapshot | null> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const { data } = await supabase
      .from('orders')
      .select(`
        fulfillment_status,
        source_order_id,
        payment_status,
        order_fulfillment_events (id, to_state, created_at)
      `)
      .eq('order_id', orderId)
      .order('created_at', { referencedTable: 'order_fulfillment_events', ascending: true })
      .maybeSingle()

    if (data) return data as OrderSnapshot

    if (attempt < RETRY_DELAYS_MS.length) {
      await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
    }
  }
  return null
}
