import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PhoneEntryScreen } from './features/auth/PhoneEntryScreen'
import { OTPVerificationScreen } from './features/auth/OTPVerificationScreen'
import { DashboardScreen } from './features/dashboard/DashboardScreen'
import { AccountScreen } from './features/account/AccountScreen'
import { MenuBrowseScreen } from './features/ordering/MenuBrowseScreen'
import { ShopCheckoutScreen } from './features/ordering/ShopCheckoutScreen'
import { UnifiedCheckoutScreen } from './features/ordering/UnifiedCheckoutScreen'
import { OrderHistoryScreen } from './features/orders/OrderHistoryScreen'
import { AddressList } from './features/account/AddressList'
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
            <Route path="/membership" element={<AccountScreen />} />
            <Route path="/account" element={<AccountScreen />} />
            <Route path="/order" element={<MenuBrowseScreen />} />
            <Route path="/checkout" element={<UnifiedCheckoutScreen />} />
            <Route path="/checkout/shop" element={<ShopCheckoutScreen />} />
            <Route path="/orders" element={<OrderHistoryScreen />} />
            <Route path="/account/addresses" element={<AddressList />} />
            <Route path="/account/notifications" element={<ComingSoonScreen title="Notifications" />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
