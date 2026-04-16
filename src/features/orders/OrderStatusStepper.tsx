type Props = { status: string }

const STEPS = [
  { key: 'pending', label: 'Placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'food_ready', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
]

const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  accepted: 1,
  preparing: 2,
  food_ready: 3,
  dispatched: 3,
  delivered: 4,
  completed: 4,
}

export function OrderStatusStepper({ status }: Props) {
  const isCancelled = status === 'cancelled'
  const currentIndex = STATUS_INDEX[status] ?? 0

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center py-4">
        <div
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: '#FEE2E2', color: '#B42C1F' }}
        >
          Order Cancelled
        </div>
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const done = i < currentIndex
          const active = i === currentIndex
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    backgroundColor: done || active ? 'var(--primary)' : 'var(--card)',
                    color: done || active ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  {done ? '✓' : i + 1}
                </div>
                <span
                  className="text-xs mt-1 text-center w-12"
                  style={{ color: active ? 'var(--primary)' : done ? 'var(--text)' : 'var(--text-secondary)', fontWeight: active ? 600 : 400 }}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 mb-4 mx-0.5"
                  style={{ backgroundColor: done ? 'var(--primary)' : 'var(--card)' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
