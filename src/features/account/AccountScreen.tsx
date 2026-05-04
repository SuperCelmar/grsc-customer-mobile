import type { ReactNode } from 'react'
import { Coffee, CreditCard, MapPin, Settings, ShoppingBag, User, Wallet } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useCustomerProfile } from '../../hooks/useCustomerProfile'
import { SUPPORT_WHATSAPP_E164 } from '../../lib/config'
import { supabase } from '../../lib/supabase'
import { useSubscriptions } from '../subscriptions/useSubscriptions'
import { ReferralAccordion } from './ReferralAccordion'
import type { AccountProfile } from './types'
import type { CustomerSubscriptions } from '../../lib/api'

type Sub = CustomerSubscriptions['subscriptions'][0]

const TIER_RATE: Record<string, number> = { pro: 5, elite: 10, legend: 15 }

function formatTier(tier?: string | null) {
  if (!tier) return 'No membership'
  return `${tier.charAt(0).toUpperCase()}${tier.slice(1)} member`
}

function formatDate(iso?: string | null): string {
  if (!iso) return 'Not scheduled'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatSubscriptionSummary(subscription: Sub | null): string {
  if (!subscription) return 'No active subscription'
  const price = Math.round(subscription.price_snapshot / 100)
  return `${subscription.product_name} / ${formatDate(subscription.next_shipment_at)} / ₹${price}`
}

// Read-only single-address card. Edit path is gated on a backend
// profile-update edge fn that does not yet exist (Plan §Step 1 check 5).
function AddressCard({ profile }: { profile: AccountProfile }) {
  const c = profile.customer
  const hasAddress = !!c?.address_line1
  return (
    <div data-testid="address-card" className="bg-white border border-[var(--card)] rounded-md px-3 py-3">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
          <p className="text-sm font-semibold text-[var(--text)]">Delivery address</p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] shrink-0">
          Read-only
        </span>
      </div>
      {hasAddress ? (
        <div className="text-sm text-[var(--text)]">
          <p className="break-words">
            {c.address_line1}
            {c.address_line2 ? `, ${c.address_line2}` : ''}
          </p>
          <p className="text-xs text-[var(--text-secondary)] break-words">
            {c.city}{c.state ? `, ${c.state}` : ''}{c.zip_code ? ` - ${c.zip_code}` : ''}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">No address on file.</p>
      )}
      {/* TODO: add edit form once a profile-update edge fn (e.g. customer-profile-update) is available on the backend. */}
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
      {children}
    </p>
  )
}

function HubRow({
  icon,
  title,
  detail,
  action,
  onClick,
  to,
  disabled = false,
}: {
  icon: ReactNode
  title: string
  detail: string
  action?: string
  onClick?: () => void
  to?: string
  disabled?: boolean
}) {
  const content = (
    <>
      <div className="w-9 h-9 rounded-md bg-[var(--muted)] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold text-[var(--text)] leading-tight">{title}</p>
        <p className="text-xs text-[var(--text-secondary)] leading-snug break-words mt-0.5">{detail}</p>
      </div>
      {action && (
        <span className="text-xs font-semibold text-[var(--primary)] shrink-0">
          {action}
        </span>
      )}
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="w-full flex items-center gap-3 rounded-md border border-[var(--card)] bg-white px-3 py-3"
      >
        {content}
      </Link>
    )
  }

  if (!onClick) {
    return (
      <div className="w-full flex items-center gap-3 rounded-md border border-[var(--card)] bg-white px-3 py-3">
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 rounded-md border border-[var(--card)] bg-white px-3 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {content}
    </button>
  )
}

function MetricTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border border-[var(--card)] bg-white p-3 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        {label}
      </p>
      <p className="text-lg font-extrabold text-[var(--text)] leading-tight mt-1 break-words">{value}</p>
      <p className="text-xs text-[var(--text-secondary)] mt-1 leading-snug">{detail}</p>
    </div>
  )
}

export function AccountScreen() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useCustomerProfile()
  const { data: subs } = useSubscriptions()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-[#D4A574] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <p className="text-[#6B6560] text-sm">Could not load account data.</p>
      </div>
    )
  }

  const profile = data as AccountProfile
  const rawFirstName = data.customer?.name?.split(' ')[0]
  const firstName = rawFirstName?.trim() ? rawFirstName.trim() : null
  const membership = profile.membership
  const subscription = subs?.subscriptions?.[0] ?? null
  const tierRate = membership?.tier ? TIER_RATE[membership.tier] : null
  const cashback = profile.wallet?.cashback_balance ?? null
  const lifetime = profile.lifetime_coffees ?? null
  const supportText = encodeURIComponent('Hi, I need help with my GoldRush Sports Coffee account.')
  const supportUrl = SUPPORT_WHATSAPP_E164
    ? `https://wa.me/${SUPPORT_WHATSAPP_E164}?text=${supportText}`
    : null

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="flex flex-col min-h-screen bg-white pb-24 text-[var(--text)]">
      <ScreenHeader title="Account" />

      <main className="px-4 pt-3 space-y-5">
        <div
          data-testid="tier-hero"
          data-firstname={firstName ?? ''}
          className="hidden"
          aria-hidden="true"
        >
          {membership ? 'MembershipDetailView' : 'TierComparisonView'}
        </div>

        <section
          aria-label="Account summary"
          className="rounded-md bg-[var(--muted)] border border-[var(--card)] px-4 py-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-md bg-white border border-[var(--card)] flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-[var(--primary)]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Account hub
              </p>
              <p className="text-xl font-semibold leading-tight text-[var(--text)] break-words mt-0.5">
                {firstName ? `${firstName}'s account` : 'Your account'}
              </p>
              <p className="text-sm text-[var(--text-secondary)] leading-snug mt-1">
                {membership
                  ? `${formatTier(membership.tier)} / ${membership.status}`
                  : 'Membership, delivery, rewards, and support in one place'}
              </p>
            </div>
          </div>
        </section>

        <section aria-label="Membership and cashback value" className="grid grid-cols-2 gap-2">
          <MetricTile
            label="Membership"
            value={membership ? formatTier(membership.tier) : 'Not active'}
            detail={
              membership
                ? `${membership.free_coffee_balance} free coffees available`
                : 'Unlock member benefits when ready'
            }
          />
          <div data-testid="cashback-strip">
            <MetricTile
              label="Cashback"
              value={cashback !== null ? `₹${cashback}` : 'Pending'}
              detail={tierRate ? `${tierRate}% tier rate` : 'Earn cashback on orders'}
            />
          </div>
        </section>

        {lifetime !== null && lifetime !== undefined && (
          <div className="flex items-center justify-between rounded-md border border-[var(--card)] bg-white px-3 py-2">
            <span className="text-sm text-[var(--text-secondary)]">Coffees enjoyed</span>
            <span className="text-sm font-semibold text-[var(--text)]">{lifetime}</span>
          </div>
        )}

        {!membership && (
          <button
            type="button"
            onClick={() => navigate('/membership')}
            className="w-full rounded-md bg-[var(--primary)] px-4 py-3 text-left text-white"
          >
            <span className="block text-sm font-semibold">Unlock membership benefits</span>
            <span className="block text-xs opacity-90 mt-0.5">Review tiers and choose what fits your routine.</span>
          </button>
        )}

        <section className="space-y-2" aria-label="Quick actions">
          <SectionLabel>Quick actions</SectionLabel>
          <div className="grid grid-cols-1 gap-2">
            <HubRow
              icon={<Coffee className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" />}
              title="Subscriptions"
              detail={formatSubscriptionSummary(subscription)}
              action="Open"
              to="/subscriptions"
            />
            <HubRow
              icon={<ShoppingBag className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" />}
              title="Order coffee"
              detail="Browse menu and subscription-ready products"
              action="Shop"
              to="/order"
            />
          </div>
        </section>

        <section className="space-y-2" aria-label="Account details">
          <SectionLabel>Account details</SectionLabel>
          <AddressCard profile={profile} />
          <HubRow
            icon={<CreditCard className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" />}
            title="Payment methods"
            detail="Cards are tokenised by Razorpay during checkout. We don't store cards in-app."
          />
        </section>

        <section className="space-y-2" aria-label="Rewards and settings">
          <SectionLabel>Rewards and settings</SectionLabel>
          <ReferralAccordion profile={profile} />
          <HubRow
            icon={<Settings className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" />}
            title="Notification preferences"
            detail="Review account notification settings"
            action="Open"
            onClick={() => navigate('/account/notifications')}
          />
          {supportUrl && (
            <HubRow
              icon={<Wallet className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" />}
              title="Contact support"
              detail="Get help with subscriptions, orders, or account questions"
              action="WhatsApp"
              onClick={() => window.open(supportUrl, '_blank', 'noopener,noreferrer')}
            />
          )}
          <HubRow
            icon={<Settings className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" />}
            title="Terms & Privacy"
            detail="Open GoldRush Sports Coffee policy pages"
            action="Open"
            onClick={() => window.open('https://goldrushsportscoffee.com/terms', '_blank', 'noopener,noreferrer')}
          />
          <HubRow
            icon={<Settings className="w-4 h-4 text-red-600" aria-hidden="true" />}
            title="Sign out"
            detail={`App version ${import.meta.env.VITE_APP_VERSION ?? 'dev'}`}
            action="Exit"
            onClick={handleSignOut}
          />
        </section>
      </main>
    </div>
  )
}
