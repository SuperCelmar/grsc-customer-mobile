import { useNavigate } from 'react-router-dom'
import { LayoutGrid, Coffee, Bean, Gift, Ticket } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface CategoryItem {
  id: string
  label: string
  Icon: LucideIcon
  filled: boolean
  to: string
}

const ITEMS: CategoryItem[] = [
  { id: 'all',     label: 'All',     Icon: LayoutGrid, filled: false, to: '/order' },
  { id: 'cafe',    label: 'Cafe',    Icon: Coffee,     filled: true,  to: '/order?category=cafe' },
  { id: 'beans',   label: 'Performance Coffee', Icon: Bean, filled: true, to: '/order?category=online-performance-coffee' },
  { id: 'hampers', label: 'Hampers', Icon: Gift,       filled: false, to: '/order?category=online-hampers' },
  { id: 'rewards', label: 'Rewards', Icon: Ticket,     filled: false, to: '/membership' },
]

export function CategoryIconsRow() {
  const navigate = useNavigate()

  return (
    <div
      className="px-4 py-4 flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {ITEMS.map(({ id, label, Icon, filled, to }) => (
        <button
          key={id}
          aria-label={`Browse ${label}`}
          onClick={() => navigate(to)}
          className="flex flex-col items-center gap-1.5 min-w-[56px] snap-start active:scale-95 transition-transform duration-100"
        >
          <span
            className="flex items-center justify-center w-12 h-12 rounded-full"
            style={
              filled
                ? { backgroundColor: '#D4A574' }
                : { backgroundColor: '#FFFFFF', border: '1px solid #D4A574' }
            }
          >
            <Icon
              size={24}
              style={filled ? { color: '#FFFFFF' } : { color: '#D4A574' }}
              aria-hidden="true"
            />
          </span>
          <span className="text-[11px] text-text-secondary leading-tight text-center">
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}
