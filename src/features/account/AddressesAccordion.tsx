import { MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Accordion, AccordionRow } from './Accordion'
import { useAddresses } from './useAddresses'
import type { CustomerAddress } from '../../lib/api'

function formatAddressSummary(address: CustomerAddress): string {
  const label = address.label ? `${address.label} · ` : ''
  return `${label}${address.line1}, ${address.city}`
}

export function AddressesAccordion() {
  const navigate = useNavigate()
  const { data: addresses = [] } = useAddresses()

  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0] ?? null
  const count = addresses.length
  const top2 = addresses.slice(0, 2)
  const extra = count - 2

  const collapsedSummary = defaultAddress
    ? formatAddressSummary(defaultAddress)
    : 'No addresses saved'

  const countPill = count > 0 ? (
    <span className="text-xs font-semibold bg-[#F5EFE9] text-[#6B6560] rounded-full px-2 py-0.5">
      {count}
    </span>
  ) : undefined

  return (
    <Accordion
      icon={MapPin}
      title="Addresses"
      rightSlot={countPill}
      defaultOpen={false}
    >
      <p className="text-sm text-[#6B6560] pb-2">{collapsedSummary}</p>

      {count === 0 ? (
        <button
          type="button"
          onClick={() => navigate('/account/addresses')}
          className="w-full text-center text-sm font-semibold text-[#D4A574] py-2"
        >
          Add your first address
        </button>
      ) : (
        <>
          {top2.map((addr) => (
            <AccordionRow key={addr.address_id}>
              <div>
                {addr.label && (
                  <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wide">
                    {addr.label}
                  </p>
                )}
                <p className="text-sm text-[#1A1410]">{addr.line1}</p>
                <p className="text-xs text-[#6B6560]">{addr.city}</p>
              </div>
              {addr.is_default && (
                <span className="text-xs font-semibold text-[#6B8E23]">Default</span>
              )}
            </AccordionRow>
          ))}
          {extra > 0 && (
            <p className="text-xs text-[#6B6560] pt-1">+{extra} more</p>
          )}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => navigate('/account/addresses')}
              className="text-sm font-semibold text-[#D4A574]"
            >
              Manage →
            </button>
          </div>
        </>
      )}
    </Accordion>
  )
}
