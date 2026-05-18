import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PhoneEntryScreen } from './features/auth/PhoneEntryScreen'
import { OTPVerificationScreen } from './features/auth/OTPVerificationScreen'
import { DashboardScreen } from './features/dashboard/DashboardScreen'
import { AccountScreen } from './features/account/AccountScreen'
import { MembershipScreen } from './features/membership/MembershipScreen'
import { PlansBrowseScreen } from './features/membership/PlansBrowseScreen'
import { MenuBrowseScreen } from './features/ordering/MenuBrowseScreen'
import { ShopCheckoutScreen } from './features/ordering/ShopCheckoutScreen'
import { UnifiedCheckoutScreen } from './features/ordering/UnifiedCheckoutScreen'
import { OrderConfirmationScreen } from './features/ordering/OrderConfirmationScreen'
import { OrderHistoryScreen } from './features/orders/OrderHistoryScreen'
import { SubscriptionsScreen } from './features/subscriptions/SubscriptionsScreen'
import { ComingSoonScreen } from './features/account/ComingSoonScreen'
import { ProtectedLayout } from './components/ProtectedLayout'
import { AppShell } from './components/AppShell'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PhoneEntryScreen />} />
        <Route path="/otp" element={<OTPVerificationScreen />} />
        <Route element={<ProtectedLayout />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardScreen />} />
            <Route path="/membership" element={<MembershipScreen />} />
            <Route path="/membership/plans" element={<PlansBrowseScreen />} />
            <Route path="/account" element={<AccountScreen />} />
            <Route path="/order" element={<MenuBrowseScreen />} />
            <Route path="/checkout" element={<UnifiedCheckoutScreen />} />
            <Route path="/checkout/shop" element={<ShopCheckoutScreen />} />
            <Route path="/orders" element={<OrderHistoryScreen />} />
            <Route path="/subscriptions" element={<SubscriptionsScreen />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmationScreen />} />
            <Route path="/account/notifications" element={<ComingSoonScreen title="Notifications" />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
