import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import { AppReadinessGate } from '../AppReadinessGate'
import { useAuth } from '../../contexts/AuthContext'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)

function renderGate() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<AppReadinessGate />}>
          <Route index element={<p>Dashboard content</p>} />
        </Route>
        <Route path="/login" element={<p>Login screen</p>} />
      </Routes>
    </MemoryRouter>
  )
}

function setAuthState(session: Session | null, loading: boolean) {
  mockUseAuth.mockReturnValue({
    session,
    loading,
    setDevSession: vi.fn(),
  })
}

describe('AppReadinessGate', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows the branded connection state while auth is loading', () => {
    setAuthState(null, true)

    renderGate()

    expect(screen.getByText('Connecting to GoldRush...')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument()
  })

  it('redirects logged-out users to login', () => {
    setAuthState(null, false)

    renderGate()

    expect(screen.getByText('Login screen')).toBeInTheDocument()
  })

  it('renders the app immediately once authenticated', () => {
    const session = { access_token: 'token' } as Session
    setAuthState(session, false)

    renderGate()

    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
  })
})
