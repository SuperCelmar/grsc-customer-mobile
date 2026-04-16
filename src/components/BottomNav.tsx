import { useNavigate, useLocation } from 'react-router-dom'
import { Home, ShoppingBag, ClipboardList, User } from 'lucide-react'

const tabs = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/order', icon: ShoppingBag, label: 'Order' },
  { path: '/orders', icon: ClipboardList, label: 'Orders' },
  { path: '/membership', icon: User, label: 'Membership' },
]

export function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white border-t border-card flex">
      {tabs.map(({ path, icon: Icon, label }) => (
        <button key={path} onClick={() => navigate(path)}
          className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors ${pathname.startsWith(path) ? 'text-primary' : 'text-text-secondary'}`}>
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
