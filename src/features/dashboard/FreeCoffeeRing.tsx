export function FreeCoffeeRing({
  remaining,
  total,
  color = '#D4A574',
}: {
  remaining: number
  total: number
  color?: string
}) {
  const r = 36
  const circ = 2 * Math.PI * r
  const progress = total > 0 ? (remaining / total) * circ : 0

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: 90, height: 90 }}>
      <svg width="90" height="90" className="-rotate-90 absolute inset-0">
        <circle cx="45" cy="45" r={r} fill="none" stroke="#E8DDD0" strokeWidth="6" />
        <circle
          cx="45"
          cy="45"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={circ - progress}
          strokeLinecap="round"
        />
      </svg>
      <div className="relative text-center z-10">
        <div className="text-xl font-bold font-display leading-none">{remaining}</div>
        <div className="text-xs text-text-secondary">coffees</div>
      </div>
    </div>
  )
}
