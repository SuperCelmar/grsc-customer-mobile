type ProcessingIntent = 'cash-order' | 'online-payment' | 'mixed-cash' | 'mixed-online'

type Props = {
  intent: ProcessingIntent
  totalLabel?: string
  className?: string
}

const COPY: Record<ProcessingIntent, { title: string; body: string; steps: string[] }> = {
  'cash-order': {
    title: 'Sending your order',
    body: 'We are creating your pickup ticket. You will pay with cash at the counter when the cafe confirms it.',
    steps: ['Creating order', 'Checking cafe queue', 'Opening order tracker'],
  },
  'online-payment': {
    title: 'Starting secure payment',
    body: 'We are preparing your payment session. Keep this screen open until the checkout window appears.',
    steps: ['Creating order', 'Opening payment', 'Saving tracker'],
  },
  'mixed-cash': {
    title: 'Processing checkout',
    body: 'Shipping payment finishes first, then your cash pickup order is sent to the cafe.',
    steps: ['Confirming shipping payment', 'Sending cafe order', 'Opening confirmation'],
  },
  'mixed-online': {
    title: 'Processing checkout',
    body: 'Shipping payment finishes first, then we will open payment for the pickup order.',
    steps: ['Confirming shipping payment', 'Preparing pickup payment', 'Opening confirmation'],
  },
}

export function OrderProcessingOverlay({ intent, totalLabel, className = '' }: Props) {
  const copy = COPY[intent]

  return (
    <div
      className={`z-40 bg-white/95 backdrop-blur-sm flex flex-col px-6 py-8 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex-1 flex flex-col justify-center">
        <div
          className="w-12 h-12 rounded-full border-[3px] border-t-transparent animate-spin mb-5"
          style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
        />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-2">
          {totalLabel ?? 'Order in progress'}
        </p>
        <h2 className="text-2xl font-semibold leading-tight text-[var(--text)]">
          {copy.title}
        </h2>
        <p className="text-sm leading-5 text-[var(--text-secondary)] mt-2 max-w-[300px]">
          {copy.body}
        </p>

        <div className="mt-7 space-y-3">
          {copy.steps.map((step, index) => (
            <div key={step} className="flex items-center gap-3">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold"
                style={{
                  backgroundColor: index === 0 ? 'var(--primary)' : 'var(--muted)',
                  color: index === 0 ? 'white' : 'var(--text-secondary)',
                }}
              >
                {index + 1}
              </span>
              <span className="text-sm font-medium text-[var(--text)]">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
