type TierCardProps = {
  name: string
  price: string
  cashbackRate: number
  freeCoffees?: number
  allowanceDays?: number
  isCurrent?: boolean
  isEarned?: boolean
  color: string
  onSelect?: () => void
}

export function TierCard({
  name,
  price,
  cashbackRate,
  freeCoffees,
  allowanceDays,
  isCurrent,
  isEarned,
  color,
  onSelect,
}: TierCardProps) {
  return (
    <div
      className={`relative min-w-[200px] rounded-lg p-5 border-2 bg-white snap-start ${isCurrent ? '' : 'border-[#E8DDD0]'}`}
      style={{ borderColor: isCurrent ? color : undefined }}
    >
      {isCurrent && (
        <span
          className="absolute top-3 right-3 text-xs font-semibold rounded-full px-2 py-0.5"
          style={{ backgroundColor: color + '22', color }}
        >
          Your Plan
        </span>
      )}
      <h3 className="font-serif text-xl font-bold mb-1" style={{ color }}>
        {name}
      </h3>
      <p className="text-2xl font-bold text-[#1A1410] mb-3">{price}</p>
      <ul className="space-y-1.5 text-sm text-[#6B6560]">
        <li>&#10003; {cashbackRate}% cashback on orders</li>
        {freeCoffees && <li>&#10003; {freeCoffees} free coffees</li>}
        {allowanceDays && <li>&#10003; {allowanceDays}-day allowance</li>}
        {isEarned && <li>&#10003; Earned by upgrading from Elite</li>}
      </ul>
      {!isCurrent && !isEarned && onSelect && (
        <button
          onClick={onSelect}
          className="mt-4 w-full h-10 rounded-md text-white text-sm font-semibold"
          style={{ backgroundColor: color }}
        >
          {name === 'Elite' ? 'Upgrade to Elite' : 'Get Started'}
        </button>
      )}
      {!isCurrent && onSelect && (
        <p className="mt-2 text-xs text-[#6B6560] text-center">Visit any GoldRush store</p>
      )}
    </div>
  )
}
