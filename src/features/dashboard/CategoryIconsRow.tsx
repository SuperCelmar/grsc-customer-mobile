import { useNavigate } from 'react-router-dom'
import {
  CafeIcon,
  ColdBrewsIcon,
  ProteinShakeIcon,
  HampersIcon,
  RewardsIcon,
  type CategoryIcon,
} from '../../assets/category-icons'

interface CategoryItem {
  id: string
  label: string
  Icon: CategoryIcon
  to: string
}

const ITEMS: CategoryItem[] = [
  { id: 'coffee',         label: 'Coffee',         Icon: CafeIcon,         to: '/order?category=cafe' },
  { id: 'cold-brews',     label: 'Cold Brews',     Icon: ColdBrewsIcon,    to: '/order?category=cold-brews' },
  { id: 'protein-shakes', label: 'Protein Shakes', Icon: ProteinShakeIcon, to: '/order?category=protein-shakes' },
  { id: 'hampers',        label: 'Hampers',        Icon: HampersIcon,      to: '/order?category=online-hampers' },
  { id: 'rewards',        label: 'Rewards',        Icon: RewardsIcon,      to: '/membership' },
]

export function CategoryIconsRow() {
  const navigate = useNavigate()

  return (
    <div className="px-3 pt-3 pb-2 flex gap-1">
      {ITEMS.map(({ id, label, Icon, to }) => (
        <button
          key={id}
          aria-label={`Browse ${label}`}
          onClick={() => navigate(to)}
          className="flex-1 flex flex-col items-center gap-1.5 active:scale-95 transition-transform duration-100"
        >
          <Icon width={28} height={28} style={{ color: '#1A1410' }} aria-hidden="true" />
          <span
            className="text-[11px] leading-tight text-center"
            style={{ color: '#1A1410' }}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}
