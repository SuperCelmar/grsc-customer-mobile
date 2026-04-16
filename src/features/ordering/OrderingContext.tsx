import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../../lib/supabase'

type StoreInfo = {
  storeId: string
  storeName: string
  petpoojaRestaurantId: string
}

type OrderingContextType = {
  storeInfo: StoreInfo | null
  storeLoading: boolean
}

const OrderingContext = createContext<OrderingContextType>({ storeInfo: null, storeLoading: true })

export function OrderingProvider({ children }: { children: ReactNode }) {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [storeLoading, setStoreLoading] = useState(true)

  useEffect(() => {
    // DEV mock: use fake store info when Twilio/backend isn't configured
    const isDevMock = import.meta.env.DEV && (() => { try { return sessionStorage.getItem('grsc_dev_session') === '1' } catch { return false } })()
    if (isDevMock) {
      setStoreInfo({ storeId: 'mock-store-001', storeName: 'GoldRush Jubilee Hills', petpoojaRestaurantId: 'mock-rest-001' })
      setStoreLoading(false)
      return
    }

    supabase
      .from('stores')
      .select('store_id, store_name, petpooja_restaurant_id')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setStoreInfo({
            storeId: data.store_id,
            storeName: data.store_name,
            petpoojaRestaurantId: data.petpooja_restaurant_id,
          })
        }
        setStoreLoading(false)
      })
  }, [])

  return (
    <OrderingContext.Provider value={{ storeInfo, storeLoading }}>
      {children}
    </OrderingContext.Provider>
  )
}

export const useOrdering = () => useContext(OrderingContext)
