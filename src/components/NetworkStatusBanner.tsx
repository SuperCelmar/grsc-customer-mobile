import { useEffect, useState } from 'react'

const RECONNECTED_VISIBLE_MS = 2400

function readOnlineState() {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

export function NetworkStatusBanner() {
  const [online, setOnline] = useState(readOnlineState)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    const handleOnline = () => {
      setOnline(true)
      setShowReconnected(true)
      timer = setTimeout(() => setShowReconnected(false), RECONNECTED_VISIBLE_MS)
    }
    const handleOffline = () => {
      if (timer) clearTimeout(timer)
      setShowReconnected(false)
      setOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (online && !showReconnected) return null

  return (
    <div className="fixed left-0 right-0 top-0 z-[60] mx-auto max-w-[430px] px-3 pt-[env(safe-area-inset-top)]">
      <div
        role="status"
        className="mt-2 rounded-md border px-3 py-2 text-center text-xs font-medium shadow-sm"
        style={{
          borderColor: online ? '#D4A574' : '#B42C1F',
          backgroundColor: online ? '#FBF8F3' : '#FFF4F2',
          color: online ? '#1A1410' : '#B42C1F',
        }}
      >
        {online ? 'Reconnected' : 'Offline - showing cached content where available'}
      </div>
    </div>
  )
}
