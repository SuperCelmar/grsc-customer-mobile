import { ScreenHeader } from '../../components/ScreenHeader'
import { SubscriptionsSection } from './SubscriptionsSection'

export function SubscriptionsScreen() {
  return (
    <div className="flex flex-col min-h-screen bg-white pb-24">
      <ScreenHeader title="Subscriptions" />
      <div className="px-4 py-4">
        <SubscriptionsSection />
      </div>
    </div>
  )
}
