import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddressForm } from '../AddressForm'

describe('AddressForm validation', () => {
  it('renders with required fields', () => {
    render(<AddressForm onSave={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByLabelText(/Address Line 1/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/City/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/State/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Pincode/i)).toBeInTheDocument()
  })

  it('rejects invalid pincode', () => {
    const onSave = vi.fn()
    render(<AddressForm onSave={onSave} onCancel={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/Address Line 1/i), { target: { value: '123 Main St' } })
    fireEvent.change(screen.getByLabelText(/City/i), { target: { value: 'Mumbai' } })
    fireEvent.change(screen.getByLabelText(/State/i), { target: { value: 'Maharashtra' } })
    fireEvent.change(screen.getByLabelText(/Pincode/i), { target: { value: '12345' } }) // only 5 digits
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText(/valid 6-digit pincode/i)).toBeInTheDocument()
  })

  it('rejects pincode starting with 0', () => {
    const onSave = vi.fn()
    render(<AddressForm onSave={onSave} onCancel={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/Address Line 1/i), { target: { value: '123 Main St' } })
    fireEvent.change(screen.getByLabelText(/City/i), { target: { value: 'Mumbai' } })
    fireEvent.change(screen.getByLabelText(/State/i), { target: { value: 'Maharashtra' } })
    fireEvent.change(screen.getByLabelText(/Pincode/i), { target: { value: '012345' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('rejects missing line1', () => {
    const onSave = vi.fn()
    render(<AddressForm onSave={onSave} onCancel={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/City/i), { target: { value: 'Mumbai' } })
    fireEvent.change(screen.getByLabelText(/State/i), { target: { value: 'Maharashtra' } })
    fireEvent.change(screen.getByLabelText(/Pincode/i), { target: { value: '400001' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('calls onSave with full payload when valid', () => {
    const onSave = vi.fn()
    render(<AddressForm onSave={onSave} onCancel={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/Address Line 1/i), { target: { value: '123 Main St' } })
    fireEvent.change(screen.getByLabelText(/City/i), { target: { value: 'Mumbai' } })
    fireEvent.change(screen.getByLabelText(/State/i), { target: { value: 'Maharashtra' } })
    fireEvent.change(screen.getByLabelText(/Pincode/i), { target: { value: '400001' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      line1: '123 Main St',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      is_default: false,
    }))
  })

  it('accepts is_default toggle', () => {
    const onSave = vi.fn()
    render(<AddressForm onSave={onSave} onCancel={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/Address Line 1/i), { target: { value: '123 Main St' } })
    fireEvent.change(screen.getByLabelText(/City/i), { target: { value: 'Mumbai' } })
    fireEvent.change(screen.getByLabelText(/State/i), { target: { value: 'Maharashtra' } })
    fireEvent.change(screen.getByLabelText(/Pincode/i), { target: { value: '400001' } })
    fireEvent.click(screen.getByLabelText(/Set as default/i))
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ is_default: true }))
  })
})
