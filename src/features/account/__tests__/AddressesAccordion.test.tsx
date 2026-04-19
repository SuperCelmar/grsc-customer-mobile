import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddressesAccordion } from '../AddressesAccordion'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('lucide-react', () => ({
  MapPin: () => null,
  ChevronDown: () => null,
  ChevronLeft: () => null,
  User: () => null,
  ShoppingBag: () => null,
}))

let mockAddresses: ReturnType<typeof makeAddress>[] = []

function makeAddress(id: string, label: string, isDefault = false) {
  return {
    address_id: id,
    customer_id: 'c-1',
    label,
    line1: `${id} Main St`,
    line2: null,
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    is_default: isDefault,
    created_at: '2026-01-01',
  }
}

vi.mock('../useAddresses', () => ({
  useAddresses: () => ({ data: mockAddresses }),
}))

beforeEach(() => {
  mockAddresses = []
  vi.clearAllMocks()
})

describe('AddressesAccordion — empty state', () => {
  it('shows "No addresses saved" when expanded', async () => {
    render(<AddressesAccordion />)
    const header = screen.getByRole('button', { name: /Addresses/i })
    await userEvent.click(header)
    expect(screen.getByText(/No addresses saved/i)).toBeInTheDocument()
  })

  it('shows "Add your first address" CTA when expanded', async () => {
    render(<AddressesAccordion />)
    const header = screen.getByRole('button', { name: /Addresses/i })
    await userEvent.click(header)
    expect(screen.getByRole('button', { name: /Add your first address/i })).toBeInTheDocument()
  })

  it('CTA navigates to /account/addresses', async () => {
    render(<AddressesAccordion />)
    const header = screen.getByRole('button', { name: /Addresses/i })
    await userEvent.click(header)
    await userEvent.click(screen.getByRole('button', { name: /Add your first address/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/account/addresses')
  })
})

describe('AddressesAccordion — with addresses', () => {
  beforeEach(() => {
    mockAddresses = [
      makeAddress('addr-1', 'Home', true),
      makeAddress('addr-2', 'Work', false),
      makeAddress('addr-3', 'Other', false),
    ]
  })

  it('shows default address label when expanded', async () => {
    render(<AddressesAccordion />)
    const header = screen.getByRole('button', { name: /Addresses/i })
    await userEvent.click(header)
    expect(screen.getAllByText(/Home/i).length).toBeGreaterThan(0)
  })

  it('shows count pill', () => {
    render(<AddressesAccordion />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows top 2 addresses when expanded', async () => {
    render(<AddressesAccordion />)
    const header = screen.getByRole('button', { name: /Addresses/i })
    await userEvent.click(header)
    expect(screen.getByText('addr-1 Main St')).toBeInTheDocument()
    expect(screen.getByText('addr-2 Main St')).toBeInTheDocument()
  })

  it('shows +1 more hint for 3 addresses', async () => {
    render(<AddressesAccordion />)
    const header = screen.getByRole('button', { name: /Addresses/i })
    await userEvent.click(header)
    expect(screen.getByText(/\+1 more/i)).toBeInTheDocument()
  })

  it('Manage button navigates to /account/addresses', async () => {
    render(<AddressesAccordion />)
    const header = screen.getByRole('button', { name: /Addresses/i })
    await userEvent.click(header)
    await userEvent.click(screen.getByRole('button', { name: /Manage/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/account/addresses')
  })
})
