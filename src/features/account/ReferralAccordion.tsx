import { useState } from 'react'
import { Gift, Copy, Check } from 'lucide-react'
import { Accordion } from './Accordion'
import type { AccountProfile } from './types'

type ReferralAccordionProps = {
  profile: AccountProfile
}

function deriveCode(profile: AccountProfile): string {
  if (profile.referral_code) return profile.referral_code.toUpperCase()
  const phone = (profile as { customer?: { phone?: string } }).customer?.phone ?? ''
  const last6 = phone.replace(/\D/g, '').slice(-6).padStart(6, '0')
  return `GRSC${last6}`
}

export function ReferralAccordion({ profile }: ReferralAccordionProps) {
  const [copied, setCopied] = useState(false)
  const code = deriveCode(profile)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = code
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      } catch { /* clipboard fallback failed silently */ }
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const whatsappText = encodeURIComponent(
    `Hey! Use my GoldRush Sports Coffee referral code ${code} to get a discount on your first order.`
  )

  const rightSlot = (
    <span className="text-xs font-semibold text-[#D4A574] bg-[#F5EFE9] px-2 py-0.5 rounded-full">
      Earn ₹100
    </span>
  )

  return (
    <Accordion icon={Gift} title="Refer a friend" rightSlot={rightSlot} defaultOpen={false}>
      <div className="border border-[#D4A574] rounded-lg p-3 mb-3 flex items-center justify-between">
        <span className="font-mono tracking-widest text-[#1A1410] font-semibold text-sm">
          {code}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy referral code'}
          className="ml-2 text-[#D4A574] shrink-0"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="w-full py-2 px-4 rounded bg-[#D4A574] text-white text-sm font-semibold mb-2"
      >
        {copied ? 'Copied!' : 'Copy code'}
      </button>

      <a
        href={`https://wa.me/?text=${whatsappText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-2 px-4 rounded border border-[#E8DDD0] text-sm font-semibold text-[#1A1410] text-center mb-3"
      >
        Share via WhatsApp
      </a>

      <p className="text-xs text-[#6B6560] text-center">
        Friends joined: 0 · Earned: ₹0
      </p>
    </Accordion>
  )
}
