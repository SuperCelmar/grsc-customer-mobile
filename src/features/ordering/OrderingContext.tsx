import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../../lib/supabase'

const TARGET_STORE_NAME = 'Store nbq7ky1z'

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
    // TODO(multischema-adapt): requires `location` schema in PostgREST exposed_schemas + SELECT RLS on location.stores. Confirm with backend before merging this branch.
    supabase
      .schema('location')
      .from('stores')
      .select('store_id, store_name, city, petpooja_restaurant_id')
      .eq('store_name', TARGET_STORE_NAME)
      .single()
      .then(({ data }) => {
        if (data) {
          setStoreInfo({
            storeId: data.store_id,
            // Display the city as the user-facing label (e.g. "Hyderabad")
            // rather than the generated store_name (e.g. "Store nbq7ky1z").
            storeName: data.city,
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
