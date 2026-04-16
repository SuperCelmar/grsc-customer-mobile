import { useEffect, useRef, useState } from 'react'

type Variant = 'active' | 'expired' | 'non-member'

type Props = {
  variant: Variant
  tier?: 'pro' | 'elite' | 'legend'
  potentialCashback?: number
  onClick: () => void
}

const SLIDES: Record<Variant, string[]> = {
  active: [
    'Fresh Crop — Tiger Blend Now Live',
    'Member Perk: 10% Off All Beans',
    'Earn 2× Points on Hampers',
  ],
  expired: [
    'Come Back to the Gold Standard',
    'Renew Pro for ₹{cashback} Cashback',
    "Don't Lose Your 5% Discount",
  ],
  'non-member': [
    'Join the Pro Coffee Circle',
    'Unlock 5% Off Every Order',
    'Taste the GoldRush Lifestyle',
  ],
}

const SUBTITLES: Record<Variant, string> = {
  active: 'Exclusive benefits for your {tier} status.',
  expired: 'Reactivate membership in one tap.',
  'non-member': 'Start saving with a Pro membership.',
}

export function HeroBanner({ variant, tier, potentialCashback, onClick }: Props) {
  const [current, setCurrent] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % 3)
    }, 4000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const headlines = SLIDES[variant]
  const rawSubtitle = SUBTITLES[variant]
  const subtitle = rawSubtitle.replace('{tier}', tier ?? 'pro')

  const headline = headlines[current].replace(
    '{cashback}',
    potentialCashback !== undefined ? String(Math.floor(potentialCashback)) : '0'
  )

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      className="mx-4 mb-2 h-[160px] rounded-md overflow-hidden relative bg-gradient-to-br from-[#D4A574] to-[#A0826D] active:scale-95 transition-transform duration-100 cursor-pointer flex flex-col justify-center p-5"
      onClick={onClick}
    >
      <div className="flex flex-col justify-center gap-2">
        <p
          className="font-display font-semibold text-white leading-tight"
          style={{ fontSize: 20 }}
        >
          {headline}
        </p>
        <p
          className="font-sans font-normal text-white/80"
          style={{ fontSize: 12 }}
        >
          {subtitle}
        </p>
        <div className="flex gap-1.5 mt-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              aria-label={`Slide ${i + 1} of 3`}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: i === current ? 'white' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
