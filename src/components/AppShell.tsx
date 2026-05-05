import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { NetworkStatusBanner } from './NetworkStatusBanner'

export function AppShell() {
  return (
    <>
      <NetworkStatusBanner />
      <div className="max-w-[430px] mx-auto min-h-screen pb-[calc(env(safe-area-inset-bottom)+64px)]">
        <Outlet />
      </div>
      <BottomNav />
    </>
  )
}
