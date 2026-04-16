import { User } from 'lucide-react'

interface HomeHeaderProps {
  storeName?: string
  isOpen?: boolean
  firstName: string
  onProfileClick: () => void
}

export function HomeHeader({ storeName, isOpen, firstName: _firstName, onProfileClick }: HomeHeaderProps) {
  return (
    <header className="px-4 pt-6 pb-2 flex items-center justify-between bg-white">
      <div className="flex flex-col">
        {storeName !== undefined && (
          <>
            <span className="text-[11px] text-text-secondary leading-tight">Pickup from</span>
            <span className="text-[14px] font-semibold font-display text-text-dark leading-snug">
              {storeName}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: isOpen ? '#6B8E23' : '#B42C1F' }}
              />
              <span
                className="text-[11px] leading-tight"
                style={{ color: isOpen ? '#6B8E23' : '#B42C1F' }}
              >
                {isOpen ? 'Open Now' : 'Currently Closed'}
              </span>
            </div>
          </>
        )}
      </div>

      <button
        aria-label="Open profile"
        onClick={onProfileClick}
        className="flex items-center justify-center rounded-full bg-muted active:scale-95 transition-transform duration-100"
        style={{ width: 44, height: 44 }}
      >
        <User size={24} className="text-text-dark" />
      </button>
    </header>
  )
}
