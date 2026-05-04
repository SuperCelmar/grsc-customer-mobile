import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, RefreshCw, SkipForward } from 'lucide-react'
import { toast } from 'sonner'
import { useSubscription, useSubscriptionActions } from './useSubscription'

export function CancelInterstitialScreen() {
  const navigate = useNavigate()
  const sub = useSubscription()
  const actions = useSubscriptionActions()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSkip() {
    if (!sub) return
    setLoading(true)
    try {
      await actions.skipNext(sub.id)
      toast.success('Next delivery skipped. See you next time!')
      navigate('/subscriptions')
    } catch {
      toast.error('Could not skip delivery. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!sub) return
    setLoading(true)
    try {
      await actions.cancel(sub.id)
      toast.success('Subscription cancelled. Your account is still active.')
      navigate('/subscriptions')
    } catch {
      toast.error('Could not cancel. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-[var(--text-secondary)] active:scale-90 transition-transform"
          aria-label="Go back"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-display font-bold text-[var(--text)]">Before you cancel</h1>
      </div>

      <div className="px-4 space-y-6">
        {/* Intro copy */}
        <p className="text-base text-[var(--text-secondary)]">
          We get it — life changes. Could one of these work better than canceling?
        </p>

        {/* Option cards */}
        <div className="space-y-3">
          {/* Change frequency */}
          <button
            onClick={() => navigate('/subscriptions?openFrequency=1')}
            disabled={loading}
            className="w-full text-left p-4 rounded-lg border flex items-start gap-4 active:scale-[0.99] transition-transform disabled:opacity-50"
            style={{ borderColor: '#E8DDD0', minHeight: 80 }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#F5EFE9' }}
            >
              <RefreshCw size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text)]">Change frequency</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Switch from biweekly to monthly — less coffee, same savings.
              </p>
            </div>
          </button>

          {/* Skip next delivery */}
          <button
            onClick={handleSkip}
            disabled={loading}
            className="w-full text-left p-4 rounded-lg border flex items-start gap-4 active:scale-[0.99] transition-transform disabled:opacity-50"
            style={{ borderColor: '#E8DDD0', minHeight: 80 }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#F5EFE9' }}
            >
              <SkipForward size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text)]">Skip your next delivery</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Pause once, resume after. No commitment changes.
              </p>
            </div>
          </button>
        </div>

        {/* Cancel section */}
        <div className="pt-2 text-center space-y-2">
          {confirmCancel ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text)]">Cancel this subscription? This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmCancel(false)}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg border text-sm font-medium disabled:opacity-50"
                  style={{ borderColor: '#E8DDD0', color: 'var(--text)' }}
                >
                  Keep it
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: '#B42C1F' }}
                >
                  {loading ? 'Cancelling…' : 'Yes, cancel'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setConfirmCancel(true)}
                disabled={loading}
                className="text-base font-medium disabled:opacity-50"
                style={{ color: '#B42C1F' }}
              >
                I still want to cancel
              </button>
              <p className="text-xs text-[var(--text-secondary)]">
                We'll keep your account so you can resubscribe anytime.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
