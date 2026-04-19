import { ReactNode } from 'react'
import { User, ShoppingBag, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  context?: string // e.g. "Pickup from"
  showStatus?: boolean
  isOpen?: boolean
  statusLabel?: string
  rightAction?: 'profile' | 'cart' | ReactNode
  onRightActionClick?: () => void
  cartCount?: number
  showBorder?: boolean
  onBack?: () => void
}

export function ScreenHeader({
  title,
  subtitle,
  context,
  showStatus,
  isOpen,
  statusLabel,
  rightAction,
  onRightActionClick,
  cartCount,
  showBorder = false,
  onBack
}: ScreenHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className={`px-4 pt-8 pb-4 bg-white ${showBorder ? 'border-b border-card' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="mt-1 text-text-secondary active:scale-90 transition-transform flex-shrink-0"
              aria-label="Go back"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <div className="flex flex-col min-w-0">
            {context && (
              <span className="text-[10px] text-text-secondary leading-tight uppercase tracking-[0.05em] font-bold mb-0.5">
                {context}
              </span>
            )}
            <h1 className="text-[22px] font-display font-bold text-text-dark leading-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <span className="text-sm text-text-secondary mt-0.5">{subtitle}</span>
            )}
            {showStatus && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isOpen ? '#6B8E23' : '#B42C1F' }}
                />
                <span
                  className="text-[12px] font-medium"
                  style={{ color: isOpen ? '#6B8E23' : '#B42C1F' }}
                >
                  {statusLabel || (isOpen ? 'Open Now' : 'Currently Closed')}
                </span>
              </div>
            )}
          </div>
        </div>

        {rightAction && (
          <div className="flex items-center flex-shrink-0">
            {rightAction === 'profile' ? (
              <button
                onClick={onRightActionClick || (() => navigate('/membership'))}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-muted text-text-dark active:scale-95 transition-transform"
                aria-label="Profile"
              >
                <User size={22} />
              </button>
            ) : rightAction === 'cart' ? (
              <button
                onClick={onRightActionClick}
                className="relative w-10 h-10 flex items-center justify-center rounded-full bg-muted text-text-dark active:scale-95 transition-transform"
                aria-label="Cart"
              >
                <ShoppingBag size={22} />
                {cartCount !== undefined && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white bg-primary border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </button>
            ) : (
              rightAction
            )}
          </div>
        )}
      </div>
    </header>
  )
}
