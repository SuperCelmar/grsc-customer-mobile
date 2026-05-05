import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function ConnectingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <div
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-md border border-card bg-muted"
        aria-hidden="true"
      >
        <span className="font-display text-xl font-bold text-primary">GR</span>
      </div>
      <p className="font-display text-xl font-semibold text-text-dark">Connecting to GoldRush...</p>
      <p className="mt-2 text-sm text-text-secondary">Checking your session</p>
      <div className="mt-6 h-1 w-36 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
      </div>
    </div>
  )
}

export function AppReadinessGate() {
  const { session, loading } = useAuth()

  if (loading) return <ConnectingScreen />
  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}
