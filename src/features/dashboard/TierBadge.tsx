const TIER_COLORS: Record<string, string> = { pro: '#A0826D', elite: '#C9A961', legend: '#D4A574' }

export function TierBadge({ tier, size = 'md' }: { tier: string; size?: 'sm' | 'md' | 'lg' }) {
  const color = TIER_COLORS[tier] ?? '#A0826D'
  const sizes = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-3 py-1', lg: 'text-base px-4 py-1.5' }
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wider ${sizes[size]}`}
      style={{ backgroundColor: color + '22', color, border: `1px solid ${color}` }}
    >
      {tier}
    </span>
  )
}
