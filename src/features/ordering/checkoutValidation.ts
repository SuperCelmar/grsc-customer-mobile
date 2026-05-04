export type MissingField = {
  key: 'address' | 'storeClosed'
  label: string
  sectionId: string
}

export function getMissingCheckoutFields(opts: {
  selectedAddressId: string | null
  isStoreOpen?: boolean
  hasCafeItems?: boolean
}): MissingField[] {
  const { selectedAddressId, isStoreOpen = true, hasCafeItems = false } = opts
  const missing: MissingField[] = []
  if (!selectedAddressId) {
    missing.push({
      key: 'address',
      label: 'Add a delivery address to your profile',
      sectionId: 'checkout-address-section',
    })
  }
  if (hasCafeItems && !isStoreOpen) {
    missing.push({
      key: 'storeClosed',
      label: 'Cafe is closed — remove cafe items',
      sectionId: 'checkout-pickup-section',
    })
  }
  return missing
}
