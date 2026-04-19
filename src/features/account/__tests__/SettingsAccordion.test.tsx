import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsAccordion } from '../SettingsAccordion'

const mockNavigate = vi.fn()
const mockSignOut = vi.fn().mockResolvedValue({})

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: { signOut: () => mockSignOut() },
  },
}))

vi.mock('../../../lib/config', () => ({
  SUPPORT_WHATSAPP_E164: '919999999999',
}))

vi.mock('lucide-react', () => ({
  Settings: () => null,
  ChevronDown: () => null,
  ChevronLeft: () => null,
  User: () => null,
  ShoppingBag: () => null,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SettingsAccordion', () => {
  it('renders Settings & Support header', () => {
    render(<SettingsAccordion />)
    expect(screen.getByText(/Settings & Support/i)).toBeInTheDocument()
  })

  it('shows sign-out row when expanded', async () => {
    render(<SettingsAccordion />)
    const header = screen.getByRole('button', { name: /Settings & Support/i })
    await userEvent.click(header)
    expect(screen.getByText(/Sign out/i)).toBeInTheDocument()
  })

  it('sign out calls supabase.auth.signOut and navigates to /login', async () => {
    render(<SettingsAccordion />)
    const header = screen.getByRole('button', { name: /Settings & Support/i })
    await userEvent.click(header)
    await userEvent.click(screen.getByText(/Sign out/i))
    expect(mockSignOut).toHaveBeenCalledOnce()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('shows notification preferences row', async () => {
    render(<SettingsAccordion />)
    const header = screen.getByRole('button', { name: /Settings & Support/i })
    await userEvent.click(header)
    expect(screen.getByText(/Notification preferences/i)).toBeInTheDocument()
  })

  it('notification preferences navigates to /account/notifications', async () => {
    render(<SettingsAccordion />)
    const header = screen.getByRole('button', { name: /Settings & Support/i })
    await userEvent.click(header)
    await userEvent.click(screen.getByText(/Notification preferences/i))
    expect(mockNavigate).toHaveBeenCalledWith('/account/notifications')
  })

  it('shows contact support row when SUPPORT_WHATSAPP_E164 is set', async () => {
    render(<SettingsAccordion />)
    const header = screen.getByRole('button', { name: /Settings & Support/i })
    await userEvent.click(header)
    expect(screen.getByText(/Contact support/i)).toBeInTheDocument()
  })
})
