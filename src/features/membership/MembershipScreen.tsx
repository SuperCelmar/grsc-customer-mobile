import { useNavigate } from 'react-router-dom'
import { useCustomerProfile } from '../../hooks/useCustomerProfile'
import { ScreenHeader } from '../../components/ScreenHeader'
import { AllowanceCard } from './AllowanceCard'

function formatRupees(amount: number): string {
  return `₹${Math.floor(amount).toLocaleString('en-IN')}`
}

export function MembershipScreen() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useCustomerProfile()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4A574] border-t-transparent" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-[#6B6560]">Could not load membership data.</p>
      </div>
    )
  }

  const allowances = (data.allowances ?? []).filter(a => a.status === 'Active')
  const cashback = data.wallet?.cashback_balance ?? 0
  const hasAllowances = allowances.length > 0

  return (
    <div className="flex min-h-screen flex-col bg-white pb-24" data-testid="membership-screen">
      <ScreenHeader title="Membership" />

      {/* Cashback strip — always visible (AC-G4) */}
      <div className="mx-4 mt-3 rounded-md border border-[#E8DDD0] bg-[#FDFCFB] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#6B6560]">Cashback Balance</p>
        <p className="mt-1 text-3xl font-bold text-[#D4A574]">{formatRupees(cashback)}</p>
        <p className="mt-0.5 text-xs text-[#6B6560]">
          Earn 10% on every order. Redeem at the counter or on online orders.
        </p>
      </div>

      <div className="mx-4 mt-5 mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B6560]">
          Your Active Plans
        </p>
        <button
          type="button"
          onClick={() => navigate('/membership/plans')}
          className="text-xs font-semibold text-[#D4A574] underline"
        >
          {hasAllowances ? 'Buy another' : 'Browse plans'}
        </button>
      </div>

      {hasAllowances ? (
        <div className="flex flex-col gap-3">
          {allowances.map(allowance => (
            <AllowanceCard key={allowance.allowance_id} allowance={allowance} />
          ))}
        </div>
      ) : (
        <div className="mx-4 rounded-md border border-dashed border-[#E8DDD0] bg-white p-6 text-center">
          <p className="text-sm font-semibold text-[#1A1410]">No active plans</p>
          <p className="mt-1 text-xs text-[#6B6560]">
            Pick a plan to unlock free items every month.
          </p>
          <button
            type="button"
            onClick={() => navigate('/membership/plans')}
            className="mt-3 rounded-md bg-[#D4A574] px-4 py-2 text-sm font-semibold text-white"
          >
            Browse Plans
          </button>
        </div>
      )}
    </div>
  )
}
