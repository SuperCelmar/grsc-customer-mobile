import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <>
      <div className="max-w-[430px] mx-auto min-h-screen pb-[calc(env(safe-area-inset-bottom)+64px)]">
        <Outlet />
      </div>
      <BottomNav />
    </>
  )
}
