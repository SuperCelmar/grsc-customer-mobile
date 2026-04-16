import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { PhoneEntryScreen } from './features/auth/PhoneEntryScreen'
import { OTPVerificationScreen } from './features/auth/OTPVerificationScreen'
import { DashboardScreen } from './features/dashboard/DashboardScreen'
import { MembershipScreen } from './features/membership/MembershipScreen'
import { MenuBrowseScreen } from './features/ordering/MenuBrowseScreen'
import { ShopCheckoutScreen } from './features/ordering/ShopCheckoutScreen'
import { OrderHistoryScreen } from './features/orders/OrderHistoryScreen'
import { AddressList } from './features/account/AddressList'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PhoneEntryScreen />} />
        <Route path="/otp" element={<OTPVerificationScreen />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
        <Route path="/membership" element={<ProtectedRoute><MembershipScreen /></ProtectedRoute>} />
        <Route path="/order" element={<ProtectedRoute><MenuBrowseScreen /></ProtectedRoute>} />
        <Route path="/checkout/shop" element={<ProtectedRoute><ShopCheckoutScreen /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrderHistoryScreen /></ProtectedRoute>} />
        <Route path="/account/addresses" element={<ProtectedRoute><AddressList /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
