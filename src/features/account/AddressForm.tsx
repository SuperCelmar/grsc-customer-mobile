import { useState } from 'react'

export type AddressInput = {
  label: string | null
  line1: string
  line2: string | null
  city: string
  state: string
  pincode: string
  is_default: boolean
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry',
]

const PINCODE_REGEX = /^[1-9]\d{5}$/

type Props = {
  onSave: (address: AddressInput) => void
  onCancel: () => void
  initial?: Partial<AddressInput>
}

export function AddressForm({ onSave, onCancel, initial }: Props) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [line1, setLine1] = useState(initial?.line1 ?? '')
  const [line2, setLine2] = useState(initial?.line2 ?? '')
  const [city, setCity] = useState(initial?.city ?? '')
  const [state, setState] = useState(initial?.state ?? '')
  const [pincode, setPincode] = useState(initial?.pincode ?? '')
  const [isDefault, setIsDefault] = useState(initial?.is_default ?? false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!line1.trim()) errs.line1 = 'Address line 1 is required'
    if (!city.trim()) errs.city = 'City is required'
    if (!state.trim()) errs.state = 'State is required'
    if (!PINCODE_REGEX.test(pincode)) errs.pincode = 'Enter a valid 6-digit pincode (cannot start with 0)'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    onSave({
      label: label.trim() || null,
      line1: line1.trim(),
      line2: line2.trim() || null,
      city: city.trim(),
      state: state.trim(),
      pincode,
      is_default: isDefault,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4">
      <div>
        <label htmlFor="label" className="block text-xs text-text-secondary mb-1">Label (optional)</label>
        <input id="label" value={label} onChange={e => setLabel(e.target.value)}
          placeholder="Home / Office"
          className="w-full border border-card rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" />
      </div>

      <div>
        <label htmlFor="line1" className="block text-xs text-text-secondary mb-1">Address Line 1 *</label>
        <input id="line1" value={line1} onChange={e => setLine1(e.target.value)}
          className="w-full border border-card rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" />
        {errors.line1 && <p className="text-error text-xs mt-1">{errors.line1}</p>}
      </div>

      <div>
        <label htmlFor="line2" className="block text-xs text-text-secondary mb-1">Address Line 2</label>
        <input id="line2" value={line2} onChange={e => setLine2(e.target.value)}
          className="w-full border border-card rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="city" className="block text-xs text-text-secondary mb-1">City *</label>
          <input id="city" value={city} onChange={e => setCity(e.target.value)}
            className="w-full border border-card rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          {errors.city && <p className="text-error text-xs mt-1">{errors.city}</p>}
        </div>
        <div>
          <label htmlFor="pincode" className="block text-xs text-text-secondary mb-1">Pincode *</label>
          <input id="pincode" value={pincode} maxLength={6} inputMode="numeric"
            onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
            className="w-full border border-card rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          {errors.pincode && <p className="text-error text-xs mt-1">{errors.pincode}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="state" className="block text-xs text-text-secondary mb-1">State *</label>
        <select id="state" value={state} onChange={e => setState(e.target.value)}
          className="w-full border border-card rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white">
          <option value="">Select state</option>
          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {errors.state && <p className="text-error text-xs mt-1">{errors.state}</p>}
      </div>

      <label className="flex items-center gap-2 pt-1">
        <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
        <span className="text-sm text-text-dark">Set as default</span>
      </label>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 rounded-md border border-card text-text-secondary text-sm font-medium">
          Cancel
        </button>
        <button type="submit"
          className="flex-1 py-2 rounded-md bg-primary text-white text-sm font-semibold">
          Save
        </button>
      </div>
    </form>
  )
}
