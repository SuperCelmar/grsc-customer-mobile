import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useCustomerProfile, useStoreMenu, useStoreStatus } from '../../hooks/useCustomerProfile'
import { OrderingProvider, useOrdering } from '../ordering/OrderingContext'
import { TransactionList } from './TransactionList'
import { HomeHeader } from './HomeHeader'
import { HomeSearchBar } from './HomeSearchBar'
import { CategoryIconsRow } from './CategoryIconsRow'
import { HeroBanner } from './HeroBanner'
import { PerformanceCoffeeGrid } from './PerformanceCoffeeGrid'
import { LoyaltyOfferBanner } from './LoyaltyOfferBanner'
import type { StoreMenu } from '../../lib/api'

function LoadingSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      {/* Header stripe */}
      <div className="px-4 pt-8 pb-4 bg-white flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="h-2.5 w-16 bg-card rounded" />
          <div className="h-6 w-48 bg-card rounded mt-1" />
          <div className="h-2.5 w-24 bg-card rounded mt-1" />
        </div>
        <div className="w-10 h-10 rounded-full bg-card" />
      </div>
      {/* Search stripe */}
      <div className="px-4 py-3">
        <div className="h-12 rounded-md bg-card" />
      </div>
      {/* Icon row */}
      <div className="px-4 py-4 flex gap-6">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-full bg-card" />
            <div className="h-2 w-8 bg-card rounded" />
          </div>
        ))}
      </div>
      {/* Hero block */}
      <div className="mx-4 h-[160px] rounded-md bg-card" />
      {/* Grid block */}
      <div className="px-4 pt-4 grid grid-cols-2 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="rounded-md bg-card" style={{ aspectRatio: '3/4' }} />
        ))}
      </div>
      {/* Banner */}
      <div className="mx-4 mt-4 h-24 rounded-md bg-card" />
      {/* List */}
      <div className="mx-4 mt-4 rounded-md bg-card h-32" />
    </div>
  )
}

function DashboardInner() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: profileData, isLoading: profileLoading, isError: profileError } = useCustomerProfile()
  const { storeInfo, storeLoading: _storeLoading } = useOrdering()
  const { data: menuData } = useStoreMenu(storeInfo?.storeId || '')
  const { data: storeStatus } = useStoreStatus(storeInfo?.petpoojaRestaurantId || '')

  // Pull-to-refresh
  const touchStartY = useRef(0)
  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > 80) qc.invalidateQueries({ queryKey: ['customer-profile'] })
  }

  if (profileLoading) return (
    <div className="min-h-screen bg-muted max-w-[430px] mx-auto pb-20">
      <LoadingSkeleton />
    </div>
  )

  if (profileError || !profileData) return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-20 flex flex-col items-center justify-center gap-4 p-4">
      <p className="text-text-secondary text-center">Could not load profile. Showing last known data.</p>
      <button
        onClick={() => qc.invalidateQueries({ queryKey: ['customer-profile'] })}
        className="text-primary text-sm underline"
      >
        Retry
      </button>
    </div>
  )

  const { customer, membership, wallet, recent_transactions } = profileData

  const firstName = customer.name?.split(' ')[0] ?? 'there'
  const isActiveMember = membership?.status === 'Active'
  const isExpiredMember = membership?.status === 'Expired'

  const heroVariant: 'active' | 'expired' | 'non-member' = isActiveMember
    ? 'active'
    : isExpiredMember
    ? 'expired'
    : 'non-member'

  const potentialCashback = Math.round(wallet.potential_cashback_balance)

  const hasPerformanceCoffee = menuData?.online_products?.some(
    (p: StoreMenu['online_products'][number]) => p.category_name === 'Performance Coffee'
  )

  return (
    <div
      className="min-h-screen bg-muted max-w-[430px] mx-auto pb-20"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <HomeHeader
        storeName={storeInfo?.storeName}
        isOpen={storeStatus?.store_status === '1'}
        firstName={firstName}
        onProfileClick={() => navigate('/membership')}
      />

      <HomeSearchBar />

      <CategoryIconsRow />

      <div className="flex flex-col gap-4 pt-2">
        <HeroBanner
          variant={heroVariant}
          tier={membership?.tier}
          potentialCashback={potentialCashback}
          onClick={() => navigate('/order?category=online-performance-coffee')}
        />

        {hasPerformanceCoffee && (
          <>
            <div className="px-4 pt-2 pb-1 flex items-center justify-between">
              <span className="font-display text-[18px] font-semibold text-text-dark">Performance Coffee</span>
              <button
                onClick={() => navigate('/order?category=online-performance-coffee')}
                className="text-[13px] text-primary font-normal"
              >
                See all →
              </button>
            </div>
            <PerformanceCoffeeGrid
              products={menuData?.online_products ?? []}
              onSelect={p => navigate(`/order?product=${p.id}`)}
              onQuickAdd={p => navigate(`/order?product=${p.id}`)}
              // quick-add navigates to picker for v1 — dedicated default-variant add is a follow-up
            />
          </>
        )}

        <LoyaltyOfferBanner
          variant={heroVariant}
          tier={membership?.tier}
          freeCoffeeBalance={membership?.free_coffee_balance}
          cashbackBalance={wallet.cashback_balance}
          potentialCashback={wallet.potential_cashback_balance}
          allowanceEndsAt={membership?.allowance_ends_at ?? null}
          onCTA={() => navigate('/membership')}
        />

        <div className="mx-4 bg-white rounded-md border border-card p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Recent Activity</p>
          <TransactionList transactions={recent_transactions} />
        </div>
      </div>
    </div>
  )
}

export function DashboardScreen() {
  return (
    <OrderingProvider>
      <DashboardInner />
    </OrderingProvider>
  )
}
