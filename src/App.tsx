import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PhoneEntryScreen } from './features/auth/PhoneEntryScreen'
import { OTPVerificationScreen } from './features/auth/OTPVerificationScreen'
import { DashboardScreen } from './features/dashboard/DashboardScreen'
import { MembershipScreen } from './features/membership/MembershipScreen'
import { MenuBrowseScreen } from './features/ordering/MenuBrowseScreen'
import { ShopCheckoutScreen } from './features/ordering/ShopCheckoutScreen'
import { OrderHistoryScreen } from './features/orders/OrderHistoryScreen'
import { AddressList } from './features/account/AddressList'
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
            <Route path="/order" element={<MenuBrowseScreen />} />
            <Route path="/checkout/shop" element={<ShopCheckoutScreen />} />
            <Route path="/orders" element={<OrderHistoryScreen />} />
            <Route path="/account/addresses" element={<AddressList />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
