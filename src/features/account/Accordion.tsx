import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ChevronDown, type LucideIcon } from 'lucide-react'

type AccordionProps = {
  icon: LucideIcon
  title: string
  rightSlot?: ReactNode
  defaultOpen?: boolean
  collapsedSummary?: ReactNode
  children: ReactNode
}

export function Accordion({
  icon: Icon,
  title,
  rightSlot,
  defaultOpen = false,
  collapsedSummary,
  children,
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const headerId = useId()
  const panelId = useId()

  const handleKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen((o) => !o)
    }
  }

  return (
    <section className="mx-4 mt-3 rounded-lg border border-[#E8DDD0] bg-white overflow-hidden">
      <button
        type="button"
        id={headerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKey}
        className={`w-full flex items-center gap-3 px-4 text-left ${collapsedSummary && !open ? 'py-2' : 'h-14'}`}
      >
        <Icon className="w-5 h-5 text-[#D4A574] shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-[#1A1410] block truncate">{title}</span>
          {collapsedSummary && !open && (
            <span className="block truncate">{collapsedSummary}</span>
          )}
        </div>
        {rightSlot && <span className="shrink-0">{rightSlot}</span>}
        <ChevronDown
          className={`w-4 h-4 text-[#6B6560] shrink-0 transition-transform duration-200 motion-reduce:transition-none ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        hidden={!open}
        className="border-t border-[#E8DDD0]"
      >
        {open && <div className="px-4 py-3">{children}</div>}
      </div>
    </section>
  )
}

type AccordionRowProps = {
  onClick?: () => void
  children: ReactNode
  className?: string
}

export function AccordionRow({ onClick, children, className = '' }: AccordionRowProps) {
  const base =
    'w-full flex items-center justify-between py-3 text-left border-b border-[#E8DDD0] last:border-b-0'
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${className}`}>
        {children}
      </button>
    )
  }
  return <div className={`${base} ${className}`}>{children}</div>
}
