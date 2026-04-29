/**
 * DEV-only mock data for UI testing without a live backend.
 * Active when using one of the test phones (TEST_PHONES). Each phone maps
 * to a distinct CustomerProfile so we can exercise every membership UX state.
 * Matches exact response shapes from edge functions.
 */

import type { CustomerProfile, StoreMenu, CustomerOrders, PlaceOrderResponse, CustomerSubscriptions } from './api'

const now = new Date()
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString()
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000).toISOString()

// 5 personas + the legacy 9999999999 alias, all logged in via FE bypass.
// Phones match the loyalty_memberships rows seeded server-side so the same
// account can later be flipped to the real backend without re-typing data.
export const TEST_PHONES = ['9000000001','9000000002','9000000003','9000000004','9000000005','9999999999'] as const
export type TestPhone = typeof TEST_PHONES[number]

// Per-persona transaction logs. Each `description` references a source_order_id
// that exists in TEST_ORDERS below so the Recent Activity panel cross-links to
// the order list. Net amounts reconcile with each wallet's cashback_balance.
const aaravTransactions = [
  { id: 'txn-aarav-1', type: 'EARN_CASHBACK', cashback_change: 22.50, free_coffee_change: 0, description: 'Order #17200001 — 5% cashback', date: daysAgo(0) },
  { id: 'txn-aarav-2', type: 'FREE_COFFEE', cashback_change: 0, free_coffee_change: -1, description: 'Free coffee redeemed on Order #17200002', date: daysAgo(5) },
  { id: 'txn-aarav-3', type: 'EARN_CASHBACK', cashback_change: 27.50, free_coffee_change: 0, description: 'Order #17200003 — 5% cashback', date: daysAgo(8) },
  { id: 'txn-aarav-4', type: 'REDEEM_CASHBACK', cashback_change: -50.00, free_coffee_change: 0, description: 'Cashback redeemed on Order #17200004', date: daysAgo(18) },
  { id: 'txn-aarav-5', type: 'EARN_CASHBACK', cashback_change: 19.00, free_coffee_change: 0, description: 'Order #17200005 — 5% cashback', date: daysAgo(32) },
]

const diyaTransactions = [
  { id: 'txn-diya-1', type: 'EARN_CASHBACK', cashback_change: 75.00, free_coffee_change: 0, description: 'Order #17300001 — 10% cashback', date: daysAgo(2) },
  { id: 'txn-diya-2', type: 'EARN_CASHBACK', cashback_change: 60.00, free_coffee_change: 0, description: 'Order #17300002 — 10% cashback', date: daysAgo(6) },
  { id: 'txn-diya-3', type: 'EARN_CASHBACK', cashback_change: 80.00, free_coffee_change: 0, description: 'Order #17300003 — 10% cashback', date: daysAgo(10) },
  { id: 'txn-diya-4', type: 'EARN_CASHBACK', cashback_change: 55.00, free_coffee_change: 0, description: 'Order #17300004 — 10% cashback', date: daysAgo(14) },
  { id: 'txn-diya-5', type: 'EARN_CASHBACK', cashback_change: 70.00, free_coffee_change: 0, description: 'Order #17300005 — 10% cashback', date: daysAgo(18) },
  { id: 'txn-diya-6', type: 'EARN_CASHBACK', cashback_change: 65.00, free_coffee_change: 0, description: 'Order #17300006 — 10% cashback', date: daysAgo(23) },
  { id: 'txn-diya-7', type: 'FREE_COFFEE', cashback_change: 0, free_coffee_change: -1, description: 'Free coffee redeemed on Order #17300003', date: daysAgo(10) },
  { id: 'txn-diya-8', type: 'EARN_CASHBACK', cashback_change: 95.00, free_coffee_change: 0, description: 'Order #17300001 — bonus 10% cashback', date: daysAgo(2) },
]

const vikramTransactions = [
  { id: 'txn-vikram-1', type: 'EARN_CASHBACK', cashback_change: 135.00, free_coffee_change: 0, description: 'Order #17400001 — 15% cashback', date: daysAgo(3) },
  { id: 'txn-vikram-2', type: 'EARN_CASHBACK', cashback_change: 110.00, free_coffee_change: 0, description: 'Order #17400002 — 15% cashback', date: daysAgo(11) },
  { id: 'txn-vikram-3', type: 'EARN_CASHBACK', cashback_change: 145.00, free_coffee_change: 0, description: 'Order #17400003 — 15% cashback', date: daysAgo(19) },
  { id: 'txn-vikram-4', type: 'EARN_CASHBACK', cashback_change: 95.00, free_coffee_change: 0, description: 'Order #17400004 — 15% cashback', date: daysAgo(28) },
  { id: 'txn-vikram-5', type: 'REDEEM_CASHBACK', cashback_change: -500.00, free_coffee_change: 0, description: 'Cashback redeemed on Order #17400005', date: daysAgo(40) },
  { id: 'txn-vikram-6', type: 'EARN_CASHBACK', cashback_change: 120.00, free_coffee_change: 0, description: 'Order #17400005 — 15% cashback', date: daysAgo(40) },
  { id: 'txn-vikram-7', type: 'EARN_CASHBACK', cashback_change: 105.00, free_coffee_change: 0, description: 'Order #17400006 — 15% cashback', date: daysAgo(55) },
  { id: 'txn-vikram-8', type: 'EARN_CASHBACK', cashback_change: 130.00, free_coffee_change: 0, description: 'Order #17400007 — 15% cashback', date: daysAgo(70) },
  { id: 'txn-vikram-9', type: 'EARN_CASHBACK', cashback_change: 90.00, free_coffee_change: 0, description: 'Order #17400008 — 15% cashback', date: daysAgo(85) },
  { id: 'txn-vikram-10', type: 'FREE_COFFEE', cashback_change: 0, free_coffee_change: -1, description: 'Free coffee redeemed on Order #17400001', date: daysAgo(3) },
]

const priyaTransactions = [
  { id: 'txn-priya-1', type: 'EARN_CASHBACK', cashback_change: 20.00, free_coffee_change: 0, description: 'Order #17500001 — 5% cashback', date: daysAgo(60) },
  { id: 'txn-priya-2', type: 'EARN_CASHBACK', cashback_change: 22.50, free_coffee_change: 0, description: 'Order #17500002 — 5% cashback', date: daysAgo(75) },
  { id: 'txn-priya-3', type: 'EARN_CASHBACK', cashback_change: 32.50, free_coffee_change: 0, description: 'Order #17500003 — 5% cashback', date: daysAgo(90) },
]

const TEST_PROFILES: Record<string, CustomerProfile> = {
  // Aarav — Pro Active, mid balance
  '9000000001': {
    success: true,
    customer: { id: 'a0000001-0000-0000-0000-000000000001', name: 'Aarav Pro', phone: '9000000001', email: 'aarav.pro+test@grsc.dev', created_at: daysAgo(90) },
    membership: { membership_id: 'mem-pro', tier: 'pro', status: 'Active', free_coffee_balance: 3, allowance_starts_at: daysAgo(30), allowance_ends_at: daysFromNow(335), daily_coffee_start_date: daysAgo(5) },
    wallet: { cashback_balance: 150.00, potential_cashback_balance: 45.00, cashback_lifetime_earned: 650.00 },
    recent_transactions: aaravTransactions,
  },
  // Diya — Elite Active, high balance
  '9000000002': {
    success: true,
    customer: { id: 'a0000001-0000-0000-0000-000000000002', name: 'Diya Elite', phone: '9000000002', email: 'diya.elite+test@grsc.dev', created_at: daysAgo(120) },
    membership: { membership_id: 'mem-elite', tier: 'elite', status: 'Active', free_coffee_balance: 5, allowance_starts_at: daysAgo(15), allowance_ends_at: daysFromNow(350), daily_coffee_start_date: daysAgo(2) },
    wallet: { cashback_balance: 500.00, potential_cashback_balance: 120.00, cashback_lifetime_earned: 2400.00 },
    recent_transactions: diyaTransactions,
  },
  // Vikram — Legend Active, top tier
  '9000000003': {
    success: true,
    customer: { id: 'a0000001-0000-0000-0000-000000000003', name: 'Vikram Legend', phone: '9000000003', email: 'vikram.legend+test@grsc.dev', created_at: daysAgo(200) },
    membership: { membership_id: 'mem-legend', tier: 'legend', status: 'Active', free_coffee_balance: 99, allowance_starts_at: daysAgo(60), allowance_ends_at: daysFromNow(305), daily_coffee_start_date: daysAgo(10) },
    wallet: { cashback_balance: 1500.00, potential_cashback_balance: 300.00, cashback_lifetime_earned: 8800.00 },
    recent_transactions: vikramTransactions,
  },
  // Priya — Pro Expired
  '9000000004': {
    success: true,
    customer: { id: 'a0000001-0000-0000-0000-000000000004', name: 'Priya Expired', phone: '9000000004', email: 'priya.expired+test@grsc.dev', created_at: daysAgo(420) },
    membership: { membership_id: 'mem-expired', tier: 'pro', status: 'Expired', free_coffee_balance: 0, allowance_starts_at: daysAgo(400), allowance_ends_at: daysAgo(10), daily_coffee_start_date: daysAgo(40) },
    wallet: { cashback_balance: 75.00, potential_cashback_balance: 0.00, cashback_lifetime_earned: 320.00 },
    recent_transactions: priyaTransactions,
  },
  // Rohan — Non-member
  '9000000005': {
    success: true,
    customer: { id: 'a0000001-0000-0000-0000-000000000005', name: 'Rohan NonMember', phone: '9000000005', email: 'rohan.free+test@grsc.dev', created_at: daysAgo(7) },
    membership: null,
    wallet: { cashback_balance: 0, potential_cashback_balance: 0, cashback_lifetime_earned: 0 },
    recent_transactions: [],
  },
}

// Default fallback profile (legacy 9999999999 alias → Pro Active).
export const mockProfile: CustomerProfile = TEST_PROFILES['9000000001']
TEST_PROFILES['9999999999'] = { ...mockProfile, customer: { ...mockProfile.customer, phone: '9999999999', name: 'Test User' } }

export function getActiveTestPhone(): string {
  try { return sessionStorage.getItem('grsc_dev_phone') || '9999999999' } catch { return '9999999999' }
}

export function getMockProfile(phone?: string): CustomerProfile {
  return TEST_PROFILES[phone || getActiveTestPhone()] || mockProfile
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

// Per-persona order datasets keyed by phone. Order ids start with `mock-` so
// ActiveOrderTracker's isMockOrder guard fires and skips real-backend polls.
// reorder_payload.items[].petpooja_item_id values match prod-1..prod-7 in
// mockMenu.products so useReorder doesn't flag 'items no longer available'.
const TEST_ORDERS: Record<string, CustomerOrders> = {
  // Aarav — 1 active 'preparing' Takeaway + 4 past
  '9000000001': {
    success: true,
    orders: [
      {
        id: '00000000-0000-0000-0000-000000000001', source_order_id: '17200001', store_name: 'GoldRush Jubilee Hills',
        status: 'preparing', order_type: 'Takeaway', total_amount: 450,
        loyalty_discount_amount: 0, cashback_earned: 22.50, item_count: 2,
        order_date: daysAgo(0), updated_at: daysAgo(0), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-1', item_name: 'Classic Latte', quantity: 1, addons: [] },
            { petpooja_item_id: 'prod-3', item_name: 'Iced Americano', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-aarav-1a', name: 'Classic Latte', quantity: 1, unit_price: 270, addons: [{ addon_name: 'Large', addon_price: 50 }] },
          { id: 'oi-aarav-1b', name: 'Iced Americano', quantity: 1, unit_price: 180, addons: [] },
        ],
      },
      {
        id: 'mock-ord-aarav-past-002', source_order_id: '17200002', store_name: 'GoldRush Jubilee Hills',
        status: 'completed', order_type: 'Dine In', total_amount: 550,
        loyalty_discount_amount: 0, cashback_earned: 27.50, item_count: 2,
        order_date: daysAgo(5), updated_at: daysAgo(5), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-2', item_name: 'Cappuccino', quantity: 1, addons: [] },
            { petpooja_item_id: 'prod-6', item_name: 'Chicken Club Sandwich', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-aarav-2a', name: 'Cappuccino', quantity: 1, unit_price: 200, addons: [] },
          { id: 'oi-aarav-2b', name: 'Chicken Club Sandwich', quantity: 1, unit_price: 280, addons: [] },
        ],
      },
      {
        id: 'mock-ord-aarav-past-003', source_order_id: '17200003', store_name: 'GoldRush Jubilee Hills',
        status: 'completed', order_type: 'Takeaway', total_amount: 480,
        loyalty_discount_amount: 0, cashback_earned: 24.00, item_count: 2,
        order_date: daysAgo(8), updated_at: daysAgo(8), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-4', item_name: 'Cold Brew', quantity: 1, addons: [] },
            { petpooja_item_id: 'prod-7', item_name: 'Energy Bites (4 pcs)', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-aarav-3a', name: 'Cold Brew', quantity: 1, unit_price: 290, addons: [{ addon_name: 'Oat Milk', addon_price: 40 }] },
          { id: 'oi-aarav-3b', name: 'Energy Bites (4 pcs)', quantity: 1, unit_price: 180, addons: [] },
        ],
      },
      {
        id: 'mock-ord-aarav-past-004', source_order_id: '17200004', store_name: 'GoldRush Jubilee Hills',
        status: 'delivered', order_type: 'Delivery', total_amount: 600,
        loyalty_discount_amount: 50, cashback_earned: 30.00, item_count: 2,
        order_date: daysAgo(18), updated_at: daysAgo(18), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-5', item_name: 'Protein Power Shake', quantity: 1, addons: [] },
            { petpooja_item_id: 'prod-1', item_name: 'Classic Latte', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-aarav-4a', name: 'Protein Power Shake', quantity: 1, unit_price: 320, addons: [] },
          { id: 'oi-aarav-4b', name: 'Classic Latte', quantity: 1, unit_price: 220, addons: [] },
        ],
      },
      {
        id: 'mock-ord-aarav-past-005', source_order_id: '17200005', store_name: 'GoldRush Jubilee Hills',
        status: 'completed', order_type: 'Takeaway', total_amount: 380,
        loyalty_discount_amount: 0, cashback_earned: 19.00, item_count: 2,
        order_date: daysAgo(32), updated_at: daysAgo(32), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-2', item_name: 'Cappuccino', quantity: 1, addons: [] },
            { petpooja_item_id: 'prod-3', item_name: 'Iced Americano', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-aarav-5a', name: 'Cappuccino', quantity: 1, unit_price: 200, addons: [] },
          { id: 'oi-aarav-5b', name: 'Iced Americano', quantity: 1, unit_price: 180, addons: [] },
        ],
      },
    ],
    total: 5,
    page: 1,
    hasMore: false,
  },

  // Diya — 0 active + 6 past
  '9000000002': {
    success: true,
    orders: [
      {
        id: 'mock-ord-diya-past-001', source_order_id: '17300001', store_name: 'GoldRush Jubilee Hills',
        status: 'completed', order_type: 'Dine In', total_amount: 750,
        loyalty_discount_amount: 0, cashback_earned: 75.00, item_count: 3,
        order_date: daysAgo(2), updated_at: daysAgo(2), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-5', item_name: 'Protein Power Shake', quantity: 1, addons: [] },
            { petpooja_item_id: 'prod-1', item_name: 'Classic Latte', quantity: 1, addons: [] },
            { petpooja_item_id: 'prod-7', item_name: 'Energy Bites (4 pcs)', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-diya-1a', name: 'Protein Power Shake', quantity: 1, unit_price: 320, addons: [{ addon_name: 'Double Protein (+30g)', addon_price: 80 }] },
          { id: 'oi-diya-1b', name: 'Classic Latte', quantity: 1, unit_price: 220, addons: [] },
          { id: 'oi-diya-1c', name: 'Energy Bites (4 pcs)', quantity: 1, unit_price: 180, addons: [] },
        ],
      },
      {
        id: 'mock-ord-diya-past-002', source_order_id: '17300002', store_name: 'GoldRush Jubilee Hills',
        status: 'completed', order_type: 'Takeaway', total_amount: 600,
        loyalty_discount_amount: 0, cashback_earned: 60.00, item_count: 2,
        order_date: daysAgo(6), updated_at: daysAgo(6), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-4', item_name: 'Cold Brew', quantity: 1, addons: [] },
            { petpooja_item_id: 'prod-6', item_name: 'Chicken Club Sandwich', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-diya-2a', name: 'Cold Brew', quantity: 1, unit_price: 290, addons: [{ addon_name: 'Almond Milk', addon_price: 40 }] },
          { id: 'oi-diya-2b', name: 'Chicken Club Sandwich', quantity: 1, unit_price: 280, addons: [] },
        ],
      },
      {
        id: 'mock-ord-diya-past-003', source_order_id: '17300003', store_name: 'GoldRush Jubilee Hills',
        status: 'delivered', order_type: 'Delivery', total_amount: 800,
        loyalty_discount_amount: 50, cashback_earned: 80.00, item_count: 3,
        order_date: daysAgo(10), updated_at: daysAgo(10), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-1', item_name: 'Classic Latte', quantity: 2, addons: [] },
            { petpooja_item_id: 'prod-5', item_name: 'Protein Power Shake', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-diya-3a', name: 'Classic Latte', quantity: 2, unit_price: 270, addons: [{ addon_name: 'Large', addon_price: 50 }] },
          { id: 'oi-diya-3b', name: 'Protein Power Shake', quantity: 1, unit_price: 320, addons: [] },
        ],
      },
      {
        id: 'mock-ord-diya-past-004', source_order_id: '17300004', store_name: 'GoldRush Jubilee Hills',
        status: 'completed', order_type: 'Dine In', total_amount: 550,
        loyalty_discount_amount: 0, cashback_earned: 55.00, item_count: 2,
        order_date: daysAgo(14), updated_at: daysAgo(14), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-2', item_name: 'Cappuccino', quantity: 1, addons: [] },
            { petpooja_item_id: 'prod-6', item_name: 'Chicken Club Sandwich', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-diya-4a', name: 'Cappuccino', quantity: 1, unit_price: 250, addons: [{ addon_name: 'Large', addon_price: 50 }] },
          { id: 'oi-diya-4b', name: 'Chicken Club Sandwich', quantity: 1, unit_price: 280, addons: [] },
        ],
      },
      {
        id: 'mock-ord-diya-past-005', source_order_id: '17300005', store_name: 'GoldRush Jubilee Hills',
        status: 'completed', order_type: 'Takeaway', total_amount: 700,
        loyalty_discount_amount: 0, cashback_earned: 70.00, item_count: 3,
        order_date: daysAgo(18), updated_at: daysAgo(18), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-3', item_name: 'Iced Americano', quantity: 1, addons: [] },
            { petpooja_item_id: 'prod-7', item_name: 'Energy Bites (4 pcs)', quantity: 2, addons: [] },
            { petpooja_item_id: 'prod-1', item_name: 'Classic Latte', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-diya-5a', name: 'Iced Americano', quantity: 1, unit_price: 180, addons: [] },
          { id: 'oi-diya-5b', name: 'Energy Bites (4 pcs)', quantity: 2, unit_price: 180, addons: [] },
          { id: 'oi-diya-5c', name: 'Classic Latte', quantity: 1, unit_price: 220, addons: [] },
        ],
      },
      {
        id: 'mock-ord-diya-past-006', source_order_id: '17300006', store_name: 'GoldRush Jubilee Hills',
        status: 'delivered', order_type: 'Delivery', total_amount: 650,
        loyalty_discount_amount: 0, cashback_earned: 65.00, item_count: 2,
        order_date: daysAgo(23), updated_at: daysAgo(23), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-4', item_name: 'Cold Brew', quantity: 1, addons: [] },
            { petpooja_item_id: 'prod-5', item_name: 'Protein Power Shake', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-diya-6a', name: 'Cold Brew', quantity: 1, unit_price: 290, addons: [{ addon_name: 'Oat Milk', addon_price: 40 }] },
          { id: 'oi-diya-6b', name: 'Protein Power Shake', quantity: 1, unit_price: 320, addons: [] },
        ],
      },
    ],
    total: 6,
    page: 1,
    hasMore: false,
  },

  // Vikram — 0 active + 8 past across 3 months
  '9000000003': {
    success: true,
    orders: [
      {
        id: 'mock-ord-vikram-past-001', source_order_id: '17400001', store_name: 'GoldRush Jubilee Hills',
        status: 'completed', order_type: 'Dine In', total_amount: 900,
        loyalty_discount_amount: 0, cashback_earned: 135.00, item_count: 3,
        order_date: daysAgo(3), updated_at: daysAgo(3), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-5', item_name: 'Protein Power Shake', quantity: 2, addons: [] },
            { petpooja_item_id: 'prod-7', item_name: 'Energy Bites (4 pcs)', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-vikram-1a', name: 'Protein Power Shake', quantity: 2, unit_price: 400, addons: [{ addon_name: 'Double Protein (+30g)', addon_price: 80 }] },
          { id: 'oi-vikram-1b', name: 'Energy Bites (4 pcs)', quantity: 1, unit_price: 180, addons: [] },
        ],
      },
      {
        id: 'mock-ord-vikram-past-002', source_order_id: '17400002', store_name: 'GoldRush Jubilee Hills',
        status: 'completed', order_type: 'Takeaway', total_amount: 750,
        loyalty_discount_amount: 0, cashback_earned: 110.00, item_count: 3,
        order_date: daysAgo(11), updated_at: daysAgo(11), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-1', item_name: 'Classic Latte', quantity: 2, addons: [] },
            { petpooja_item_id: 'prod-6', item_name: 'Chicken Club Sandwich', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-vikram-2a', name: 'Classic Latte', quantity: 2, unit_price: 235, addons: [] },
          { id: 'oi-vikram-2b', name: 'Chicken Club Sandwich', quantity: 1, unit_price: 280, addons: [] },
        ],
      },
      {
        id: 'mock-ord-vikram-past-003', source_order_id: '17400003', store_name: 'GoldRush Jubilee Hills',
        status: 'delivered', order_type: 'Delivery', total_amount: 950,
        loyalty_discount_amount: 50, cashback_earned: 145.00, item_count: 4,
        order_date: daysAgo(19), updated_at: daysAgo(19), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-4', item_name: 'Cold Brew', quantity: 1, addons: [] },
            { petpooja_item_id: 'prod-2', item_name: 'Cappuccino', quantity: 1, addons: [] },
            { petpooja_item_id: 'prod-7', item_name: 'Energy Bites (4 pcs)', quantity: 2, addons: [] },
          ],
        },
        items: [
          { id: 'oi-vikram-3a', name: 'Cold Brew', quantity: 1, unit_price: 290, addons: [{ addon_name: 'Almond Milk', addon_price: 40 }] },
          { id: 'oi-vikram-3b', name: 'Cappuccino', quantity: 1, unit_price: 250, addons: [{ addon_name: 'Large', addon_price: 50 }] },
          { id: 'oi-vikram-3c', name: 'Energy Bites (4 pcs)', quantity: 2, unit_price: 180, addons: [] },
        ],
      },
      {
        id: 'mock-ord-vikram-past-004', source_order_id: '17400004', store_name: 'GoldRush Jubilee Hills',
        status: 'completed', order_type: 'Takeaway', total_amount: 620,
        loyalty_discount_amount: 0, cashback_earned: 95.00, item_count: 2,
        order_date: daysAgo(28), updated_at: daysAgo(28), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-3', item_name: 'Iced Americano', quantity: 2, addons: [] },
            { petpooja_item_id: 'prod-6', item_name: 'Chicken Club Sandwich', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-vikram-4a', name: 'Iced Americano', quantity: 2, unit_price: 180, addons: [] },
          { id: 'oi-vikram-4b', name: 'Chicken Club Sandwich', quantity: 1, unit_price: 280, addons: [] },
        ],
      },
      {
        id: 'mock-ord-vikram-past-005', source_order_id: '17400005', store_name: 'GoldRush Jubilee Hills',
        status: 'completed', order_type: 'Dine In', total_amount: 800,
        loyalty_discount_amount: 100, cashback_earned: 120.00, item_count: 3,
        order_date: daysAgo(40), updated_at: daysAgo(40), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-5', item_name: 'Protein Power Shake', quantity: 1, addons: [] },
            { petpooja_item_id: 'prod-1', item_name: 'Classic Latte', quantity: 2, addons: [] },
          ],
        },
        items: [
          { id: 'oi-vikram-5a', name: 'Protein Power Shake', quantity: 1, unit_price: 320, addons: [] },
          { id: 'oi-vikram-5b', name: 'Classic Latte', quantity: 2, unit_price: 240, addons: [{ addon_name: 'Extra Shot', addon_price: 40 }] },
        ],
      },
      {
        id: 'mock-ord-vikram-past-006', source_order_id: '17400006', store_name: 'GoldRush Jubilee Hills',
        status: 'delivered', order_type: 'Delivery', total_amount: 700,
        loyalty_discount_amount: 0, cashback_earned: 105.00, item_count: 3,
        order_date: daysAgo(55), updated_at: daysAgo(55), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-2', item_name: 'Cappuccino', quantity: 2, addons: [] },
            { petpooja_item_id: 'prod-7', item_name: 'Energy Bites (4 pcs)', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-vikram-6a', name: 'Cappuccino', quantity: 2, unit_price: 250, addons: [{ addon_name: 'Large', addon_price: 50 }] },
          { id: 'oi-vikram-6b', name: 'Energy Bites (4 pcs)', quantity: 1, unit_price: 180, addons: [] },
        ],
      },
      {
        id: 'mock-ord-vikram-past-007', source_order_id: '17400007', store_name: 'GoldRush Jubilee Hills',
        status: 'completed', order_type: 'Takeaway', total_amount: 870,
        loyalty_discount_amount: 0, cashback_earned: 130.00, item_count: 3,
        order_date: daysAgo(70), updated_at: daysAgo(70), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-4', item_name: 'Cold Brew', quantity: 2, addons: [] },
            { petpooja_item_id: 'prod-6', item_name: 'Chicken Club Sandwich', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-vikram-7a', name: 'Cold Brew', quantity: 2, unit_price: 295, addons: [{ addon_name: 'Oat Milk', addon_price: 40 }] },
          { id: 'oi-vikram-7b', name: 'Chicken Club Sandwich', quantity: 1, unit_price: 280, addons: [] },
        ],
      },
      {
        id: 'mock-ord-vikram-past-008', source_order_id: '17400008', store_name: 'GoldRush Jubilee Hills',
        status: 'delivered', order_type: 'Delivery', total_amount: 600,
        loyalty_discount_amount: 0, cashback_earned: 90.00, item_count: 2,
        order_date: daysAgo(85), updated_at: daysAgo(85), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-1', item_name: 'Classic Latte', quantity: 1, addons: [] },
            { petpooja_item_id: 'prod-5', item_name: 'Protein Power Shake', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-vikram-8a', name: 'Classic Latte', quantity: 1, unit_price: 270, addons: [{ addon_name: 'Large', addon_price: 50 }] },
          { id: 'oi-vikram-8b', name: 'Protein Power Shake', quantity: 1, unit_price: 320, addons: [] },
        ],
      },
    ],
    total: 8,
    page: 1,
    hasMore: false,
  },

  // Priya — 0 active + 3 old past from her active period (60-90 days ago)
  '9000000004': {
    success: true,
    orders: [
      {
        id: 'mock-ord-priya-past-001', source_order_id: '17500001', store_name: 'GoldRush Jubilee Hills',
        status: 'completed', order_type: 'Takeaway', total_amount: 400,
        loyalty_discount_amount: 0, cashback_earned: 20.00, item_count: 2,
        order_date: daysAgo(60), updated_at: daysAgo(60), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-2', item_name: 'Cappuccino', quantity: 1, addons: [] },
            { petpooja_item_id: 'prod-7', item_name: 'Energy Bites (4 pcs)', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-priya-1a', name: 'Cappuccino', quantity: 1, unit_price: 200, addons: [] },
          { id: 'oi-priya-1b', name: 'Energy Bites (4 pcs)', quantity: 1, unit_price: 180, addons: [] },
        ],
      },
      {
        id: 'mock-ord-priya-past-002', source_order_id: '17500002', store_name: 'GoldRush Jubilee Hills',
        status: 'delivered', order_type: 'Delivery', total_amount: 450,
        loyalty_discount_amount: 0, cashback_earned: 22.50, item_count: 2,
        order_date: daysAgo(75), updated_at: daysAgo(75), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-1', item_name: 'Classic Latte', quantity: 1, addons: [] },
            { petpooja_item_id: 'prod-3', item_name: 'Iced Americano', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-priya-2a', name: 'Classic Latte', quantity: 1, unit_price: 220, addons: [] },
          { id: 'oi-priya-2b', name: 'Iced Americano', quantity: 1, unit_price: 180, addons: [] },
        ],
      },
      {
        id: 'mock-ord-priya-past-003', source_order_id: '17500003', store_name: 'GoldRush Jubilee Hills',
        status: 'completed', order_type: 'Dine In', total_amount: 410,
        loyalty_discount_amount: 0, cashback_earned: 32.50, item_count: 2,
        order_date: daysAgo(90), updated_at: daysAgo(90), payment_status: 'Paid',
        reorder_payload: {
          kind: 'cafe',
          items: [
            { petpooja_item_id: 'prod-4', item_name: 'Cold Brew', quantity: 1, addons: [] },
            { petpooja_item_id: 'prod-6', item_name: 'Chicken Club Sandwich', quantity: 1, addons: [] },
          ],
        },
        items: [
          { id: 'oi-priya-3a', name: 'Cold Brew', quantity: 1, unit_price: 250, addons: [] },
          { id: 'oi-priya-3b', name: 'Chicken Club Sandwich', quantity: 1, unit_price: 280, addons: [] },
        ],
      },
    ],
    total: 3,
    page: 1,
    hasMore: false,
  },

  // Rohan — empty
  '9000000005': {
    success: true,
    orders: [],
    total: 0,
    page: 1,
    hasMore: false,
  },
}

// Legacy alias — 9999999999 reuses Aarav's dataset.
TEST_ORDERS['9999999999'] = TEST_ORDERS['9000000001']

export const mockOrders: CustomerOrders = TEST_ORDERS['9999999999']

export function getMockOrders(phone?: string): CustomerOrders {
  return TEST_ORDERS[phone || getActiveTestPhone()] || mockOrders
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
  order_id: '00000000-0000-0000-0000-000000000002',
  source_order_id: '99990001',
  inbox_id: 'mock-inbox',
  status: 'Placed',
}

export const mockOnlineOrder = {
  success: true,
  order_id: '00000000-0000-0000-0000-000000000003',
  razorpay_order_id: 'order_mock12345',
  razorpay_key_id: 'rzp_test_mock',
  amount_paise: 140000,
  currency: 'INR' as const,
}

export const mockCashfreeOrder = {
  success: true,
  order_id: '00000000-0000-0000-0000-000000000004',
  payment_session_id: 'cf_session_mock12345',
}

export const mockVerifyPayment = {
  success: true,
  order_id: '00000000-0000-0000-0000-000000000003',
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
    case 'customer-profile': return getMockProfile()
    case 'customer-menu': return mockMenu
    case 'customer-orders': return getMockOrders()
    case 'store-status-get': return mockStoreStatus
    case 'loyalty-rewards': return mockRewards
    case 'external-order': return mockPlaceOrder
    case 'loyalty-redeem': return { success: true, transactionId: 'mock-txn', rewardName: 'Cashback', discountAmount: 50 }
    case 'online-order-create': return mockOnlineOrder
    case 'cashfree-order-create': return mockCashfreeOrder
    case 'razorpay-verify-payment': return mockVerifyPayment
    case 'subscriptions': return mockSubscriptions
    default: return null
  }
}
