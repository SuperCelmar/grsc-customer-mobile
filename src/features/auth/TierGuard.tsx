import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useMembershipStatus } from './useMembershipStatus'

interface TierGuardProps {
  require: 'active-member' | 'any-member'
  fallback: string
  children: ReactNode
}

export function TierGuard({ require, fallback, children }: TierGuardProps) {
  const status = useMembershipStatus()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (require === 'active-member' && status !== 'active-member') {
    return <Navigate to={fallback} replace />
  }

  if (require === 'any-member' && status === 'non-member') {
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
