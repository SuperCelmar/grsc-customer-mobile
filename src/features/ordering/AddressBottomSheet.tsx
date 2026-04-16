import { useState } from 'react'
import { AddressForm } from '../account/AddressForm'
import type { AddressInput } from '../account/AddressForm'
import { api } from '../../lib/api'
import type { CustomerAddress } from '../../lib/api'

type Props = {
  onSelected: (address: CustomerAddress) => void
  onCancel: () => void
}

export function AddressBottomSheet({ onSelected, onCancel }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(input: AddressInput) {
    setSaving(true)
    setError(null)
    try {
      const newAddress = await api.createAddress(input)
      onSelected(newAddress)
    } catch (err: any) {
      setError(err.message || 'Failed to save address')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-t-2xl max-h-[92vh] flex flex-col">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-[var(--card)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">Add Delivery Address</h2>
          <button onClick={onCancel} className="text-[var(--text-secondary)] text-xl p-1">×</button>
        </div>

        <div className="overflow-y-auto flex-1">
          {error && (
            <div className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className={saving ? 'pointer-events-none opacity-60' : ''}>
            <AddressForm onSave={handleSave} onCancel={onCancel} />
          </div>
          {saving && (
            <div className="flex justify-center py-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--primary)] border-t-transparent" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
