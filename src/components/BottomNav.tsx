import { useNavigate, useLocation } from 'react-router-dom'
import { House, Coffee, History, CircleUser, type LucideIcon } from 'lucide-react'
import { useReorder } from '../features/orders/useReorder'

const tabs: { path: string; icon: LucideIcon; label: string }[] = [
  { path: '/dashboard', icon: House, label: 'Home' },
  { path: '/order', icon: Coffee, label: 'Shop' },
  { path: '/orders', icon: History, label: 'Reorder' },
  { path: '/membership', icon: CircleUser, label: 'Account' },
]

export function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { canReorder, reorder } = useReorder()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-[430px] mx-auto bg-white border-t border-card flex px-2 pb-[env(safe-area-inset-bottom)]">
      {tabs.map(({ path, icon: Icon, label }) => {
        const isActive = path === '/order' ? pathname === path || pathname.startsWith(path + '/') : pathname.startsWith(path)
        const handleClick = () => {
          if (path === '/orders') {
            if (canReorder) reorder()
            else navigate('/orders')
          } else {
            navigate(path)
          }
        }
        return (
          <button
            key={path}
            onClick={handleClick}
            className={`flex-1 flex flex-col items-center pt-3 pb-2 gap-1 active:scale-95 transition-all ${
              isActive ? 'text-primary' : 'text-[#1A1410]/60'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
