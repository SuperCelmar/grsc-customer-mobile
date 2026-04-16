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

const LEGEND_CONFIG = {
  key: 'legend',
  name: 'Legend',
  price: 'Earned',
  cashbackRate: 15,
  color: '#D4A574',
}

type TierComparisonViewProps = {
  currentTier?: 'pro' | 'elite' | 'legend' | null
}

export function TierComparisonView({ currentTier }: TierComparisonViewProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF]">
      <div className="px-4 pt-10 pb-4">
        <h1 className="font-serif text-2xl font-bold text-[#1A1410]">Choose Your Plan</h1>
        <p className="text-sm text-[#6B6560] mt-1">
          Unlock cashback, free coffees, and more.
        </p>
      </div>

      {/* Swipeable tier cards */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 pb-4 scrollbar-none">
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

        {/* Legend — earned, not purchasable */}
        <TierCard
          key="legend"
          name={LEGEND_CONFIG.name}
          price={LEGEND_CONFIG.price}
          cashbackRate={LEGEND_CONFIG.cashbackRate}
          isCurrent={currentTier === 'legend'}
          isEarned
          color={LEGEND_CONFIG.color}
        />
      </div>

      {/* Legend explainer */}
      <div className="mx-4 mt-2 rounded-lg bg-[#F5EFE9] p-4">
        <p className="text-sm font-semibold text-[#1A1410]">How to earn Legend</p>
        <p className="text-sm text-[#6B6560] mt-1">
          Reach Elite and accumulate enough spend to unlock Legend status automatically.
          Legend gives you 15% cashback and a daily free coffee — for life.
        </p>
      </div>
    </div>
  )
}
