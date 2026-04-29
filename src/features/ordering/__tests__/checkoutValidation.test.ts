import { describe, it, expect } from 'vitest'
import { getMissingCheckoutFields } from '../checkoutValidation'

describe('getMissingCheckoutFields', () => {
  it('returns empty array when all conditions pass', () => {
    expect(getMissingCheckoutFields({
      selectedAddressId: 'addr-1',
      isStoreOpen: true,
      hasCafeItems: true,
    })).toEqual([])
  })

  it('flags missing address', () => {
    const missing = getMissingCheckoutFields({
      selectedAddressId: null,
      isStoreOpen: true,
      hasCafeItems: false,
    })
    expect(missing).toHaveLength(1)
    expect(missing[0].key).toBe('address')
    expect(missing[0].sectionId).toBe('checkout-address-section')
  })

  it('flags closed cafe only when cart has cafe items', () => {
    expect(getMissingCheckoutFields({
      selectedAddressId: 'addr-1',
      isStoreOpen: false,
      hasCafeItems: false,
    })).toEqual([])

    const missing = getMissingCheckoutFields({
      selectedAddressId: 'addr-1',
      isStoreOpen: false,
      hasCafeItems: true,
    })
    expect(missing).toHaveLength(1)
    expect(missing[0].key).toBe('storeClosed')
  })

  it('flags both missing address and closed store', () => {
    const missing = getMissingCheckoutFields({
      selectedAddressId: null,
      isStoreOpen: false,
      hasCafeItems: true,
    })
    expect(missing.map(m => m.key)).toEqual(['address', 'storeClosed'])
  })

  it('defaults isStoreOpen=true and hasCafeItems=false for shop-only callsites', () => {
    expect(getMissingCheckoutFields({ selectedAddressId: 'addr-1' })).toEqual([])
    expect(getMissingCheckoutFields({ selectedAddressId: null })).toHaveLength(1)
  })
})
