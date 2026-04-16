import type { CustomerProfile } from '../../lib/api'

type Transaction = CustomerProfile['recent_transactions'][number]

function txIcon(type: string) {
  if (type.includes('redeem')) return '↓'
  if (type.includes('coffee')) return '☕'
  if (type.includes('membership')) return '★'
  return '↑'
}

function txLabel(type: string) {
  if (type === 'cashback_earned') return 'Cashback earned'
  if (type === 'cashback_redeemed') return 'Cashback redeemed'
  if (type === 'free_coffee_redeemed') return 'Free coffee'
  if (type === 'membership_purchase') return 'Membership'
  return type.replace(/_/g, ' ')
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const items = transactions.slice(0, 5)

  if (items.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-text-secondary text-sm">Place your first order to start earning!</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-muted">
      {items.map((t) => {
        const isCredit = (t.cashback_change ?? 0) > 0 || (t.free_coffee_change ?? 0) > 0
        return (
          <li key={t.id} className="flex items-center gap-3 py-3">
            <span className="text-lg w-6 text-center">{txIcon(t.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-dark truncate">{txLabel(t.type)}</p>
              {t.description && (
                <p className="text-xs text-text-secondary truncate">{t.description}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              {t.cashback_change !== null && t.cashback_change !== 0 && (
                <p className={`text-sm font-semibold ${isCredit ? 'text-success' : 'text-error'}`}>
                  {isCredit ? '+' : ''}₹{Math.abs(t.cashback_change).toFixed(2)}
                </p>
              )}
              {t.free_coffee_change !== null && t.free_coffee_change !== 0 && (
                <p className="text-xs text-text-secondary">
                  {t.free_coffee_change > 0 ? '+' : ''}{t.free_coffee_change} coffee
                </p>
              )}
              <p className="text-xs text-text-secondary">{formatDate(t.date)}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
