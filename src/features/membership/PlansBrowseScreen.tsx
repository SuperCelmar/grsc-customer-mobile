import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '../../lib/api'
import type { BrowsablePlan } from '../../lib/api'
import { useCustomerProfile } from '../../hooks/useCustomerProfile'
import { useRazorpay } from '../ordering/useRazorpay'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useMembershipPlans, usePurchaseMembership } from './useMembershipPlans'

function formatPrice(rupees: number): string {
  return `₹${rupees.toLocaleString('en-IN')}`
}

type PlanCardProps = {
  plan: BrowsablePlan
  onBuy: (plan: BrowsablePlan) => void
  busyPlanId: string | null
}

function PlanCard({ plan, onBuy, busyPlanId }: PlanCardProps) {
  const busy = busyPlanId === plan.plan_id
  const disabled = busyPlanId !== null && !busy

  return (
    <div
      data-testid="plan-card"
      data-plan-id={plan.plan_id}
      className="mx-4 rounded-md border border-[#E8DDD0] bg-white p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#A0826D]">
            {plan.category_name ?? 'Plan'}
          </p>
          <p className="mt-0.5 truncate text-lg font-semibold text-[#1A1410]">
            {plan.plan_name}
          </p>
          <p className="mt-1 text-xs text-[#6B6560]">
            {plan.allowance_count} × {plan.category_name ?? 'item'}
            {' · '}
            {plan.duration_days} days
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-bold text-[#1A1410]">{formatPrice(plan.price)}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onBuy(plan)}
        disabled={disabled || busy}
        className="mt-3 w-full rounded-md bg-[#D4A574] py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? 'Opening Razorpay…' : 'Buy with Razorpay'}
      </button>
    </div>
  )
}

export function PlansBrowseScreen() {
  const navigate = useNavigate()
  const { data: profile } = useCustomerProfile()
  const { data: plansData, isLoading, isError, refetch } = useMembershipPlans()
  const { open: openRazorpay } = useRazorpay()
  const purchase = usePurchaseMembership()

  const [busyPlanId, setBusyPlanId] = useState<string | null>(null)

  async function handleBuy(plan: BrowsablePlan) {
    if (busyPlanId) return
    setBusyPlanId(plan.plan_id)

    try {
      const order = await api.createMembershipOrder(plan.plan_id)

      await openRazorpay({
        key: order.razorpay_key_id,
        order_id: order.razorpay_order_id,
        amount: order.amount_paise,
        currency: 'INR',
        name: 'GoldRush Sports Coffee',
        description: order.plan_name,
        prefill: {
          name: profile?.customer.name ?? undefined,
          contact: profile?.customer.phone ?? undefined,
          email: profile?.customer.email ?? undefined,
        },
        theme: { color: '#D4A574' },
        handler: async (resp) => {
          try {
            await purchase.mutateAsync({
              plan_id: plan.plan_id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            })
            toast.success(`${plan.plan_name} activated`)
            navigate('/membership')
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Membership activation failed')
          } finally {
            setBusyPlanId(null)
          }
        },
        ondismiss: () => {
          setBusyPlanId(null)
        },
      })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not start payment')
      setBusyPlanId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4A574] border-t-transparent" />
      </div>
    )
  }

  if (isError || !plansData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-[#6B6560]">Could not load plans.</p>
        <button
          onClick={() => refetch()}
          className="text-sm font-semibold text-[#D4A574] underline"
        >
          Retry
        </button>
      </div>
    )
  }

  const plans = plansData.plans

  return (
    <div className="flex min-h-screen flex-col bg-white pb-24" data-testid="plans-browse-screen">
      <ScreenHeader title="Choose a Plan" />

      <div className="px-4 pt-3 pb-2">
        <p className="text-sm text-[#6B6560]">
          Pick a plan to unlock free items and 10% cashback on every order.
        </p>
      </div>

      {plans.length === 0 ? (
        <p className="mx-4 mt-6 text-sm text-[#6B6560]">No plans are available right now.</p>
      ) : (
        <div className="flex flex-col gap-3 mt-2">
          {plans.map((plan) => (
            <PlanCard
              key={plan.plan_id}
              plan={plan}
              onBuy={handleBuy}
              busyPlanId={busyPlanId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
