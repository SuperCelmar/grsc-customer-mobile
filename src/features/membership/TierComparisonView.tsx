import { TierCard } from './TierCard'

const TIER_CONFIG = [
  {
    key: 'pro',
    name: 'Pro',
    price: '₹1,000',
    cashbackRate: 5,
    freeCoffees: 10,
    allowanceDays: 60,
    color: '#A0826D',
  },
  {
    key: 'elite',
    name: 'Elite',
    price: '₹3,000',
    cashbackRate: 10,
    freeCoffees: 20,
    allowanceDays: 90,
    color: '#C9A961',
  },
]

type TierComparisonViewProps = {
  currentTier?: 'pro' | 'elite' | 'legend' | null
  greeting?: string | null
}

export function TierComparisonView({ currentTier, greeting }: TierComparisonViewProps) {
  return (
    <div className="flex flex-col bg-[#FFFFFF]">
      <div className="px-4 pt-10 pb-4">
        <h1 className="font-serif text-2xl font-bold text-[#1A1410]">Choose Your Plan</h1>
        <p className="text-sm text-[#6B6560] mt-1">
          {greeting ? `Hi, ${greeting} — unlock cashback, free coffees, and more.` : 'Unlock cashback, free coffees, and more.'}
        </p>
      </div>

      {/* 2-column grid: Pro + Elite */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        {TIER_CONFIG.map((tier) => (
          <TierCard
            key={tier.key}
            name={tier.name}
            price={tier.price}
            cashbackRate={tier.cashbackRate}
            freeCoffees={tier.freeCoffees}
            allowanceDays={tier.allowanceDays}
            isCurrent={currentTier === tier.key}
            color={tier.color}
            onSelect={currentTier !== tier.key ? () => {} : undefined}
          />
        ))}
      </div>

      {/* Legend — aspirational footer, not a purchasable card */}
      <div className="mx-4 mt-3 px-3 py-2 rounded-[6px] bg-[#F5EFE9] flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-[#1A1410]">LEGEND</p>
          <p className="text-[12px] text-[#6B6560]">15% cashback · daily free coffee — earned at scale</p>
        </div>
        <span className="text-[20px] text-[#A0826D]">∞</span>
      </div>

      <div className="pb-3" />
    </div>
  )
}
