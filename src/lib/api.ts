import { supabase } from './supabase'
import { getMockResponse } from './mock-data'

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

function isDevMock(): boolean {
  try { return import.meta.env.DEV && sessionStorage.getItem('grsc_dev_session') === '1' } catch { return false }
}

async function callFunction<T>(name: string, body?: unknown, options?: { method?: string; noAuth?: boolean }): Promise<T> {
  // DEV mock: return fake data instead of hitting the real backend
  if (isDevMock()) {
    const mock = getMockResponse(name)
    if (mock) {
      await new Promise(r => setTimeout(r, 200)) // simulate network latency
      return mock as T
    }
  }

  const session = (await supabase.auth.getSession()).data.session
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    'x-source': 'web',
  }
  if (session?.access_token && !options?.noAuth) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  const response = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: options?.method || 'POST',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await response.json()
  if (!response.ok || data.success === false) {
    const msg = data.error || 'Request failed'
    if (msg.includes('insufficient') || msg.includes('balance')) throw Object.assign(new Error(msg), { code: 'INSUFFICIENT_BALANCE' })
    if (msg.includes('expired') && msg.includes('allowance')) throw Object.assign(new Error(msg), { code: 'EXPIRED_ALLOWANCE' })
    if (msg.includes('not found') || msg.includes('reward')) throw Object.assign(new Error(msg), { code: 'REWARD_NOT_FOUND' })
    if (msg.includes('closed')) throw Object.assign(new Error(msg), { code: 'STORE_CLOSED' })
    throw new Error(msg)
  }
  return data
}

// Exact shapes matching edge function JSON responses

export type CustomerProfile = {
  success: boolean
  customer: {
    id: string
    name: string | null
    phone: string
    email: string | null
    created_at: string
  }
  membership: {
    membership_id: string
    tier: 'pro' | 'elite' | 'legend'
    status: 'Active' | 'Expired'
    free_coffee_balance: number
    allowance_starts_at: string | null
    allowance_ends_at: string | null
    daily_coffee_start_date: string | null
  } | null
  wallet: {
    cashback_balance: number
    potential_cashback_balance: number
    cashback_lifetime_earned: number
  }
  recent_transactions: Array<{
    id: string
    type: string
    cashback_change: number
    free_coffee_change: number
    description: string | null
    date: string
  }>
}

export type StoreMenu = {
  success: boolean
  store: {
    id: string
    code: string
    name: string
    petpooja_restaurant_id: string
  }
  menu_version: { id: string; version_hash: string } | null
  categories: Array<{ id: string; name: string; sort_order: number }>
  products: Array<{
    id: string
    name: string
    description: string | null
    price: number
    category_ids: string[]
    addon_groups: Array<{
      id: string
      name: string
      min_selection: number
      max_selection: number
      addons: Array<{ id: string; code: string; name: string; price: number }>
    }>
  }>
  online_products: Array<{
    id: string
    name: string
    description: string | null
    image_url: string | null
    source_id: string
    category_name: 'Performance Coffee' | 'Hampers'
    subscription_eligible: boolean
    variants: Array<{
      variant_id: string
      name: string
      price_paise: number
      stock_status: 'instock' | 'outofstock'
      attributes: Record<string, string>
      sku: string | null
    }>
  }>
}

export type ReorderPayload = {
  kind: 'cafe'
  items: Array<{
    petpooja_item_id: string
    item_name: string
    quantity: number
    addons: Array<{
      petpooja_addon_id: string
      mapped_addon_id: number
      name: string
      price: number
    }>
  }>
}

export type CustomerOrders = {
  success: boolean
  orders: Array<{
    id: string
    source_order_id: string
    store_name: string
    status: string
    order_type: string
    total_amount: number
    loyalty_discount_amount: number
    cashback_earned: number
    item_count: number
    order_date: string
    updated_at: string
    payment_status: string
    reorder_payload: ReorderPayload | null
    items: Array<{
      id: string
      name: string
      quantity: number
      unit_price: number
      addons: Array<{ addon_name: string; addon_price: number }>
    }>
  }>
  total: number
  page: number
  hasMore: boolean
}

export type PlaceOrderRequest = {
  customer: { phone: string; name: string; address?: string }
  order: {
    restID: string
    order_type: string
    payment_type: string
    total: number
    tax_total: number
    discount_total: number
    table_no?: string
  }
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
    tax_percentage: number
    addons: Array<{ id: string; name: string; price: number }>
  }>
}

export type PlaceOrderResponse = {
  order_id: string
  source_order_id: string
  inbox_id: string
  status: string
}

export type OnlineOrderRequest = {
  items: Array<{ variant_id: string; quantity: number }>
  shipping_address_id: string
  applied_reward_id?: string
}

export type OnlineOrderResponse = {
  success: boolean
  order_id: string
  razorpay_order_id: string
  razorpay_key_id: string
  amount_paise: number
  currency: 'INR'
}

export type VerifyPaymentRequest = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export type CustomerAddress = {
  address_id: string
  customer_id: string
  label: string | null
  line1: string
  line2: string | null
  city: string
  state: string
  pincode: string
  is_default: boolean
  created_at: string
}

export type SubscriptionInterval = 'week' | 'month'
export type SubscriptionStatus = 'active' | 'paused' | 'past_due' | 'cancelled' | 'cancelled_payment_failed'

export type CustomerSubscriptions = {
  success: boolean
  subscriptions: Array<{
    id: string
    product_id: string
    product_name: string
    variant_id: string | null
    variant_name: string | null
    image_url: string | null
    interval: SubscriptionInterval
    interval_count: number
    next_shipment_at: string
    last_charged_at: string | null
    status: SubscriptionStatus
    price_snapshot: number
  }>
}

export const api = {
  getCustomerProfile: () =>
    callFunction<CustomerProfile>('customer-profile', {}),

  getStoreMenu: (storeId: string) =>
    callFunction<StoreMenu>('customer-menu', { storeId }, { noAuth: true }),

  getStoreStatus: (restID: string) =>
    callFunction<{ store_status: '1' | '0'; restID: string }>(
      `store-status-get?restID=${restID}`,
      undefined,
      { method: 'GET', noAuth: true }
    ),

  getAvailableRewards: (customerId: string, orderAmount: number) =>
    callFunction<{ rewards: Array<{ id: string; name: string; type: string; balance: number; redeemable: boolean }> }>(
      'loyalty-rewards',
      { customerId, orderAmount }
    ),

  redeemReward: (params: { customerId: string; rewardId: string; orderId: string; amountToRedeem: number }) =>
    callFunction<{ transactionId: string; rewardName: string; discountAmount: number }>(
      'loyalty-redeem',
      { ...params, source: 'web' }
    ),

  placeOrder: (order: PlaceOrderRequest) =>
    callFunction<PlaceOrderResponse>('external-order', order),

  getCustomerOrders: (page = 1, limit = 10, activeOnly = false) =>
    callFunction<CustomerOrders>('customer-orders', { page, limit, activeOnly }),

  getSubscriptions: () =>
    callFunction<CustomerSubscriptions>('subscriptions', undefined, { method: 'GET' }),

  // Online store (beans)
  createOnlineOrder: (input: OnlineOrderRequest) =>
    callFunction<OnlineOrderResponse>('online-order-create', input),

  verifyRazorpayPayment: (input: VerifyPaymentRequest) =>
    callFunction<{ success: boolean; order_id: string; status: string; cashback_awarded?: number }>(
      'razorpay-verify-payment', input
    ),

  // Addresses (direct table access via RLS)
  listAddresses: async (): Promise<CustomerAddress[]> => {
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data as CustomerAddress[]) || []
  },

  createAddress: async (address: Omit<CustomerAddress, 'address_id' | 'customer_id' | 'created_at'>): Promise<CustomerAddress> => {
    const { data, error } = await supabase
      .from('customer_addresses')
      .insert(address)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as CustomerAddress
  },

  deleteAddress: async (address_id: string): Promise<void> => {
    const { error } = await supabase.from('customer_addresses').delete().eq('address_id', address_id)
    if (error) throw new Error(error.message)
  },
}
