import { CreditCard } from 'lucide-react'
import { Accordion } from './Accordion'

export function PaymentsAccordion() {
  return (
    <Accordion icon={CreditCard} title="Payment methods" defaultOpen={false}>
      <p className="text-sm text-[#6B6560] mb-3">
        Your cards are tokenised by Razorpay during checkout. We don't store cards in-app.
      </p>
      <button
        type="button"
        disabled
        title="Coming soon"
        className="w-full py-2 px-4 rounded border border-[#E8DDD0] text-sm text-[#6B6560] bg-[#F5EFE9] cursor-not-allowed"
      >
        Manage cards
      </button>
    </Accordion>
  )
}
