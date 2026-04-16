import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { AddressBottomSheet } from '../ordering/AddressBottomSheet'
import type { CustomerAddress } from '../../lib/api'

export function AddressList() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showSheet, setShowSheet] = useState(false)

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: api.listAddresses,
  })

  const deleteMutation = useMutation({
    mutationFn: (address_id: string) => api.deleteAddress(address_id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  })

  function handleDelete(addr: CustomerAddress) {
    if (!confirm('Delete this address?')) return
    deleteMutation.mutate(addr.address_id)
  }

  function handleAddressAdded() {
    qc.invalidateQueries({ queryKey: ['addresses'] })
    setShowSheet(false)
  }

  return (
    <div className="min-h-screen bg-[var(--muted)] max-w-[430px] mx-auto flex flex-col">
      <div className="bg-white px-4 pt-12 pb-4 flex items-center gap-3 border-b border-[var(--card)]">
        <button onClick={() => navigate(-1)} className="text-[var(--text)] p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-[var(--text)]">Saved Addresses</h1>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        ) : addresses.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] py-8 text-sm">No saved addresses yet.</p>
        ) : (
          addresses.map(addr => (
            <div key={addr.address_id} className="bg-white rounded-lg border border-[var(--card)] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    {addr.label && (
                      <span className="text-sm font-semibold text-[var(--text)]">{addr.label}</span>
                    )}
                    {addr.is_default && (
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--muted)', color: 'var(--primary)' }}>
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text)]">
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(addr)}
                  disabled={deleteMutation.isPending}
                  className="text-xs text-red-500 shrink-0 mt-0.5"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}

        <button
          onClick={() => setShowSheet(true)}
          className="w-full py-3 rounded-lg border font-semibold text-sm mt-2"
          style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
        >
          + Add new address
        </button>
      </div>

      {showSheet && (
        <AddressBottomSheet
          onSelected={handleAddressAdded}
          onCancel={() => setShowSheet(false)}
        />
      )}
    </div>
  )
}
