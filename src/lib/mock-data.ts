/**
 * DEV-only mock data for UI testing without a live backend.
 * Active when using the test phone bypass (VITE_TEST_PHONE).
 * Matches exact response shapes from edge functions.
 */

import type { CustomerProfile, StoreMenu, CustomerOrders, PlaceOrderResponse, CustomerSubscriptions } from './api'

const now = new Date()
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString()
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000).toISOString()

export const mockProfile: CustomerProfile = {
  success: true,
  customer: {
    id: 'mock-cust-001',
    name: 'Test User',
    phone: '9999999999',
    email: null,
    created_at: daysAgo(90),
  },
  membership: {
    membership_id: 'mock-mem-001',
    tier: 'pro',
    status: 'Active',
    free_coffee_balance: 2,
    allowance_starts_at: daysAgo(30),
    allowance_ends_at: daysFromNow(335),
    daily_coffee_start_date: daysAgo(5),
  },
  wallet: {
    cashback_balance: 245.50,
    potential_cashback_balance: 45.00,
    cashback_lifetime_earned: 1280.75,
  },
  recent_transactions: [
    { id: 'txn-1', type: 'EARN_CASHBACK', cashback_change: 22.50, free_coffee_change: 0, description: 'Order #1720 — 5% cashback', date: daysAgo(1) },
    { id: 'txn-2', type: 'FREE_COFFEE', cashback_change: 0, free_coffee_change: -1, description: 'Free coffee redeemed', date: daysAgo(3) },
    { id: 'txn-3', type: 'EARN_CASHBACK', cashback_change: 35.00, free_coffee_change: 0, description: 'Order #1698 — 5% cashback', date: daysAgo(5) },
    { id: 'txn-4', type: 'REDEEM_CASHBACK', cashback_change: -100.00, free_coffee_change: 0, description: 'Cashback redeemed on Order #1685', date: daysAgo(8) },
    { id: 'txn-5', type: 'EARN_CASHBACK', cashback_change: 18.75, free_coffee_change: 0, description: 'Order #1670 — 5% cashback', date: daysAgo(12) },
  ],
}

export const mockMenu: StoreMenu = {
  success: true,
  store: {
    id: 'mock-store-001',
    code: 'GR-HYD-01',
    name: 'GoldRush Jubilee Hills',
    petpooja_restaurant_id: 'mock-rest-001',
  },
  menu_version: { id: 'mv-001', version_hash: 'mock-hash' },
  categories: [
    { id: 'cat-1', name: 'Hot Coffee', sort_order: 1 },
    { id: 'cat-2', name: 'Cold Coffee', sort_order: 2 },
    { id: 'cat-3', name: 'Protein Shakes', sort_order: 3 },
    { id: 'cat-4', name: 'Snacks', sort_order: 4 },
  ],
  products: [
    {
      id: 'prod-1', name: 'Classic Latte', description: 'Rich espresso with steamed milk', price: 220,
      category_ids: ['cat-1'],
      addon_groups: [
        {
          id: 'ag-1', name: 'Size', min_selection: 1, max_selection: 1,
          addons: [
            { id: 'a-1', code: 'REG', name: 'Regular', price: 0 },
            { id: 'a-2', code: 'LRG', name: 'Large', price: 50 },
          ],
        },
        {
          id: 'ag-2', name: 'Extras', min_selection: 0, max_selection: 3,
          addons: [
            { id: 'a-3', code: 'SHOT', name: 'Extra Shot', price: 40 },
            { id: 'a-4', code: 'WHIP', name: 'Whipped Cream', price: 30 },
            { id: 'a-5', code: 'CARAMEL', name: 'Caramel Drizzle', price: 25 },
          ],
        },
      ],
    },
    {
      id: 'prod-2', name: 'Cappuccino', description: 'Espresso topped with thick milk foam', price: 200,
      category_ids: ['cat-1'],
      addon_groups: [
        {
          id: 'ag-1', name: 'Size', min_selection: 1, max_selection: 1,
          addons: [
            { id: 'a-1', code: 'REG', name: 'Regular', price: 0 },
            { id: 'a-2', code: 'LRG', name: 'Large', price: 50 },
          ],
        },
      ],
    },
    {
      id: 'prod-3', name: 'Iced Americano', description: 'Bold espresso over ice', price: 180,
      category_ids: ['cat-2'],
      addon_groups: [],
    },
    {
      id: 'prod-4', name: 'Cold Brew', description: 'Slow-steeped for 18 hours, smooth and strong', price: 250,
      category_ids: ['cat-2'],
      addon_groups: [
        {
          id: 'ag-3', name: 'Milk', min_selection: 0, max_selection: 1,
          addons: [
            { id: 'a-6', code: 'OAT', name: 'Oat Milk', price: 40 },
            { id: 'a-7', code: 'ALMD', name: 'Almond Milk', price: 40 },
          ],
        },
      ],
    },
    {
      id: 'prod-5', name: 'Protein Power Shake', description: 'Whey protein with banana and peanut butter', price: 320,
      category_ids: ['cat-3'],
      addon_groups: [
        {
          id: 'ag-4', name: 'Protein Boost', min_selection: 0, max_selection: 1,
          addons: [
            { id: 'a-8', code: 'XPROT', name: 'Double Protein (+30g)', price: 80 },
          ],
        },
      ],
    },
    {
      id: 'prod-6', name: 'Chicken Club Sandwich', description: 'Grilled chicken with lettuce, tomato & mayo', price: 280,
      category_ids: ['cat-4'],
      addon_groups: [],
    },
    {
      id: 'prod-7', name: 'Energy Bites (4 pcs)', description: 'Dates, oats, dark chocolate & chia seeds', price: 180,
      category_ids: ['cat-4'],
      addon_groups: [],
    },
  ],
  online_products: [
    {
      id: 'mock-bolt',
      name: 'Goldrush Inspired By Bolt',
      description: 'A champion blend crafted for explosive energy and unmatched speed.',
      image_url: 'https://goldrushsportscoffee.com/wp-content/uploads/2025/01/BOLT.png',
      source_id: '981',
      category_name: 'Performance Coffee',
      subscription_eligible: true,
      variants: [
        { variant_id: 'mock-var-bolt-coarse', name: 'Coarse', price_paise: 140000, stock_status: 'instock', attributes: { 'grind-size': 'coarse' }, sku: null },
        { variant_id: 'mock-var-bolt-fine', name: 'Fine', price_paise: 140000, stock_status: 'instock', attributes: { 'grind-size': 'fine' }, sku: null },
        { variant_id: 'mock-var-bolt-medium', name: 'Medium', price_paise: 140000, stock_status: 'instock', attributes: { 'grind-size': 'medium' }, sku: null },
        { variant_id: 'mock-var-bolt-very-fine', name: 'Very Fine', price_paise: 140000, stock_status: 'instock', attributes: { 'grind-size': 'very-fine' }, sku: null },
        { variant_id: 'mock-var-bolt-whole-bean', name: 'Whole Bean', price_paise: 140000, stock_status: 'instock', attributes: { 'grind-size': 'whole-bean' }, sku: null },
      ],
    },
    {
      id: 'mock-jordan',
      name: 'Goldrush Inspired By Jordan',
      description: 'A perfectly balanced roast for those who pursue greatness with grace.',
      image_url: 'https://goldrushsportscoffee.com/wp-content/uploads/2025/01/JORDAN.png',
      source_id: '991',
      category_name: 'Performance Coffee',
      subscription_eligible: true,
      variants: [
        { variant_id: 'mock-var-jordan-coarse', name: 'Coarse', price_paise: 140000, stock_status: 'instock', attributes: { 'grind-size': 'coarse' }, sku: null },
        { variant_id: 'mock-var-jordan-fine', name: 'Fine', price_paise: 140000, stock_status: 'instock', attributes: { 'grind-size': 'fine' }, sku: null },
        { variant_id: 'mock-var-jordan-medium', name: 'Medium', price_paise: 140000, stock_status: 'instock', attributes: { 'grind-size': 'medium' }, sku: null },
        { variant_id: 'mock-var-jordan-very-fine', name: 'Very Fine', price_paise: 140000, stock_status: 'instock', attributes: { 'grind-size': 'very-fine' }, sku: null },
        { variant_id: 'mock-var-jordan-whole-bean', name: 'Whole Bean', price_paise: 140000, stock_status: 'instock', attributes: { 'grind-size': 'whole-bean' }, sku: null },
      ],
    },
    {
      id: 'mock-tiger',
      name: 'Goldrush Inspired By Tiger',
      description: 'A sophisticated single-origin with the precision and focus of a champion.',
      image_url: 'https://goldrushsportscoffee.com/wp-content/uploads/2025/01/TIGER.png',
      source_id: '992',
      category_name: 'Performance Coffee',
      subscription_eligible: true,
      variants: [
        { variant_id: 'mock-var-tiger-coarse', name: 'Coarse', price_paise: 140000, stock_status: 'instock', attributes: { 'grind-size': 'coarse' }, sku: null },
        { variant_id: 'mock-var-tiger-fine', name: 'Fine', price_paise: 140000, stock_status: 'instock', attributes: { 'grind-size': 'fine' }, sku: null },
        { variant_id: 'mock-var-tiger-medium', name: 'Medium', price_paise: 140000, stock_status: 'instock', attributes: { 'grind-size': 'medium' }, sku: null },
        { variant_id: 'mock-var-tiger-very-fine', name: 'Very Fine', price_paise: 140000, stock_status: 'instock', attributes: { 'grind-size': 'very-fine' }, sku: null },
        { variant_id: 'mock-var-tiger-whole-bean', name: 'Whole Bean', price_paise: 140000, stock_status: 'instock', attributes: { 'grind-size': 'whole-bean' }, sku: null },
      ],
    },
    {
      id: 'mock-hamper',
      name: 'Christmas Hamper',
      description: 'A festive gift set featuring our finest beans, perfect for the holiday season.',
      image_url: 'https://goldrushsportscoffee.com/wp-content/uploads/2025/12/hamper.png',
      source_id: '7480',
      category_name: 'Hampers',
      subscription_eligible: false,
      variants: [
        { variant_id: 'mock-var-hamper-elite', name: 'Elite — French Press & MDF Box', price_paise: 500000, stock_status: 'instock', attributes: { package: 'elite' }, sku: null },
        { variant_id: 'mock-var-hamper-special', name: 'Special — Without French Press & MDF Box', price_paise: 350000, stock_status: 'instock', attributes: { package: 'special' }, sku: null },
      ],
    },
  ],
}

export const mockOrders: CustomerOrders = {
  success: true,
  orders: [
    {
      id: 'ord-1', source_order_id: '17200001', store_name: 'GoldRush Jubilee Hills',
      status: 'Preparing', order_type: 'Takeaway', total_amount: 450,
      loyalty_discount_amount: 0, cashback_earned: 22.50, item_count: 2,
      order_date: daysAgo(0), updated_at: daysAgo(0), payment_status: 'Paid',
      reorder_payload: null,
      items: [
        { id: 'oi-1', name: 'Classic Latte', quantity: 1, unit_price: 270, addons: [{ addon_name: 'Large', addon_price: 50 }] },
        { id: 'oi-2', name: 'Iced Americano', quantity: 1, unit_price: 180, addons: [] },
      ],
    },
    {
      id: 'ord-2', source_order_id: '16980002', store_name: 'GoldRush Jubilee Hills',
      status: 'Completed', order_type: 'Dine In', total_amount: 700,
      loyalty_discount_amount: 100, cashback_earned: 35.00, item_count: 3,
      order_date: daysAgo(5), updated_at: daysAgo(5), payment_status: 'Paid',
      reorder_payload: null,
      items: [
        { id: 'oi-3', name: 'Protein Power Shake', quantity: 1, unit_price: 320, addons: [] },
        { id: 'oi-4', name: 'Cold Brew', quantity: 1, unit_price: 290, addons: [{ addon_name: 'Oat Milk', addon_price: 40 }] },
        { id: 'oi-5', name: 'Energy Bites (4 pcs)', quantity: 1, unit_price: 180, addons: [] },
      ],
    },
    {
      id: 'ord-3', source_order_id: '16850003', store_name: 'GoldRush Jubilee Hills',
      status: 'Completed', order_type: 'Takeaway', total_amount: 520,
      loyalty_discount_amount: 0, cashback_earned: 26.00, item_count: 2,
      order_date: daysAgo(8), updated_at: daysAgo(8), payment_status: 'Paid',
      reorder_payload: null,
      items: [
        { id: 'oi-6', name: 'Cappuccino', quantity: 2, unit_price: 200, addons: [] },
        { id: 'oi-7', name: 'Chicken Club Sandwich', quantity: 1, unit_price: 280, addons: [] },
      ],
    },
  ],
  total: 3,
  page: 1,
  hasMore: false,
}

export const mockStoreStatus = { store_status: '1' as const, restID: 'mock-rest-001' }

export const mockRewards = {
  success: true,
  rewards: [
    { id: 'rwd-1', name: 'Cashback Balance', type: 'cashback', balance: 245.50, redeemable: true },
    { id: 'rwd-2', name: 'Free Coffee', type: 'free_coffee', balance: 2, redeemable: true },
  ],
}

export const mockPlaceOrder: PlaceOrderResponse = {
  order_id: 'mock-ord-new',
  source_order_id: '99990001',
  inbox_id: 'mock-inbox',
  status: 'Placed',
}

export const mockOnlineOrder = {
  success: true,
  order_id: 'mock-online-ord-new',
  razorpay_order_id: 'order_mock12345',
  razorpay_key_id: 'rzp_test_mock',
  amount_paise: 140000,
  currency: 'INR' as const,
}

export const mockVerifyPayment = {
  success: true,
  order_id: 'mock-online-ord-new',
  status: 'paid',
  cashback_awarded: 70,
}

export const mockSubscriptions: CustomerSubscriptions = {
  success: true,
  subscriptions: [
    {
      id: 'sub-1',
      product_id: 'mock-bolt',
      product_name: 'Goldrush Inspired By Bolt',
      variant_id: 'mock-var-bolt-medium',
      variant_name: 'Medium',
      image_url: 'https://goldrushsportscoffee.com/wp-content/uploads/2025/01/BOLT.png',
      interval: 'month',
      interval_count: 1,
      next_shipment_at: daysFromNow(12),
      last_charged_at: daysAgo(18),
      status: 'active',
      price_snapshot: 126000,
    },
    {
      id: 'sub-2',
      product_id: 'mock-jordan',
      product_name: 'Goldrush Inspired By Jordan',
      variant_id: 'mock-var-jordan-whole-bean',
      variant_name: 'Whole Bean',
      image_url: 'https://goldrushsportscoffee.com/wp-content/uploads/2025/01/JORDAN.png',
      interval: 'week',
      interval_count: 2,
      next_shipment_at: daysFromNow(5),
      last_charged_at: daysAgo(9),
      status: 'paused',
      price_snapshot: 126000,
    },
  ],
}

// Route mock function name → response
export function getMockResponse(functionName: string): unknown | null {
  const name = functionName.split('?')[0] // strip query params
  switch (name) {
    case 'customer-profile': return mockProfile
    case 'customer-menu': return mockMenu
    case 'customer-orders': return mockOrders
    case 'store-status-get': return mockStoreStatus
    case 'loyalty-rewards': return mockRewards
    case 'external-order': return mockPlaceOrder
    case 'loyalty-redeem': return { success: true, transactionId: 'mock-txn', rewardName: 'Cashback', discountAmount: 50 }
    case 'online-order-create': return mockOnlineOrder
    case 'razorpay-verify-payment': return mockVerifyPayment
    case 'subscriptions': return mockSubscriptions
    default: return null
  }
}
