import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ShoppingBag, Gift, ClipboardList } from 'lucide-react'
import { useCustomerProfile } from '../../hooks/useCustomerProfile'
import { BottomNav } from '../../components/BottomNav'
import { TierBadge } from './TierBadge'
import { FreeCoffeeRing } from './FreeCoffeeRing'
import { TransactionList } from './TransactionList'

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const diff = new Date(iso).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

function ExpiryBadge({ endsAt }: { endsAt: string | null }) {
  const days = daysUntil(endsAt)
  if (days === null) return null
  if (days <= 0) return <span className="text-xs font-medium text-error">Allowance expired</span>
  if (days === 0) return <span className="text-xs font-medium text-error">Expires today — Renew now!</span>
  return <span className="text-xs text-text-secondary">Expires in {days} day{days !== 1 ? 's' : ''}</span>
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 animate-pulse">
      <div className="h-6 w-32 bg-card rounded" />
      <div className="rounded-xl bg-card h-48" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => <div key={i} className="h-16 bg-card rounded-xl" />)}
      </div>
      <div className="rounded-xl bg-card h-40" />
    </div>
  )
}

export function DashboardScreen() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data, isLoading, isError } = useCustomerProfile()

  // Pull-to-refresh
  const touchStartY = useRef(0)
  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > 80) qc.invalidateQueries({ queryKey: ['customer-profile'] })
  }

  if (isLoading) return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-20">
      <LoadingSkeleton />
      <BottomNav />
    </div>
  )

  if (isError || !data) return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-20 flex flex-col items-center justify-center gap-4 p-4">
      <p className="text-text-secondary text-center">Could not load profile. Showing last known data.</p>
      <button onClick={() => qc.invalidateQueries({ queryKey: ['customer-profile'] })}
        className="text-primary text-sm underline">Retry</button>
      <BottomNav />
    </div>
  )

  const { customer, membership, wallet, recent_transactions } = data

  const firstName = customer.name?.split(' ')[0] ?? 'there'
  const isActiveMember = membership?.status === 'Active'
  const isExpiredMember = membership?.status === 'Expired'

  return (
    <div
      className="min-h-screen bg-muted max-w-[430px] mx-auto pb-20"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-text-secondary">Welcome back</p>
          <h1 className="text-xl font-bold font-display text-text-dark">Hi, {firstName}</h1>
        </div>
        {membership && <TierBadge tier={membership.tier} />}
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">

        {/* Main loyalty card */}
        {isActiveMember && membership ? (
          <div className="bg-white rounded-xl border border-card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Cashback Available</p>
                <p className="text-3xl font-bold font-display text-text-dark">
                  ₹{wallet.cashback_balance.toFixed(2)}
                </p>
              </div>
              <TierBadge tier={membership.tier} size="sm" />
            </div>

            {membership.free_coffee_balance >= 0 && (
              <div className="flex items-center gap-4 pt-4 border-t border-muted">
                <FreeCoffeeRing
                  remaining={membership.free_coffee_balance}
                  total={membership.tier === 'elite' ? 20 : membership.tier === 'legend' ? 20 : 10}
                  color={membership.tier === 'elite' ? '#C9A961' : membership.tier === 'legend' ? '#D4A574' : '#A0826D'}
                />
                <div>
                  <p className="text-sm font-semibold text-text-dark">
                    {membership.free_coffee_balance} free coffee{membership.free_coffee_balance !== 1 ? 's' : ''} remaining
                  </p>
                  <ExpiryBadge endsAt={membership.allowance_ends_at} />
                </div>
              </div>
            )}
          </div>
        ) : isExpiredMember && membership ? (
          <div className="bg-white rounded-xl border border-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Cashback Balance</p>
                <p className="text-3xl font-bold font-display text-text-dark">
                  ₹{wallet.cashback_balance.toFixed(2)}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full text-xs px-2 py-0.5 font-semibold uppercase tracking-wider bg-error/10 text-error border border-error/30">
                Expired
              </span>
            </div>
            {membership.allowance_ends_at && (
              <p className="text-xs text-text-secondary mb-3">
                Your membership expired on{' '}
                {new Date(membership.allowance_ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            <button
              onClick={() => navigate('/membership')}
              className="w-full bg-primary text-white rounded-md py-2.5 text-sm font-semibold"
            >
              Renew your membership
            </button>
          </div>
        ) : (
          /* Non-member */
          <div className="bg-white rounded-xl border border-card p-5">
            <h2 className="text-lg font-bold font-display text-text-dark mb-1">Unlock Your Rewards</h2>
            {wallet.potential_cashback_balance > 0 && (
              <p className="text-sm text-text-secondary mb-4">
                You've earned{' '}
                <span className="font-semibold text-primary">₹{wallet.potential_cashback_balance.toFixed(2)}</span>{' '}
                in potential cashback waiting to be unlocked.
              </p>
            )}
            <button
              onClick={() => navigate('/membership')}
              className="w-full bg-primary text-white rounded-md py-2.5 text-sm font-semibold"
            >
              Become a Pro Member →
            </button>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Quick Actions</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Order', icon: ShoppingBag, path: '/order' },
              { label: 'Rewards', icon: Gift, path: '/membership' },
              { label: 'History', icon: ClipboardList, path: '/orders' },
            ].map(({ label, icon: Icon, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="bg-white rounded-xl border border-card flex flex-col items-center gap-1.5 py-4 text-text-secondary hover:text-primary transition-colors"
              >
                <Icon size={22} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-xl border border-card p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Recent Activity</p>
          <TransactionList transactions={recent_transactions} />
        </div>

      </div>

      <BottomNav />
    </div>
  )
}
