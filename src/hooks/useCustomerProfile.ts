import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { PlaceOrderRequest } from '../lib/api'

export const useCustomerProfile = () =>
  useQuery({
    queryKey: ['customer-profile'],
    queryFn: api.getCustomerProfile,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

export const useStoreMenu = (storeId: string) =>
  useQuery({
    queryKey: ['store-menu', storeId],
    queryFn: () => api.getStoreMenu(storeId),
    staleTime: 300_000,
    enabled: !!storeId,
  })

export const useStoreStatus = (restID: string) =>
  useQuery({
    queryKey: ['store-status', restID],
    queryFn: () => api.getStoreStatus(restID),
    staleTime: 10_000,
    enabled: !!restID,
  })

export const useAvailableRewards = (customerId: string, orderAmount: number) =>
  useQuery({
    queryKey: ['rewards', customerId, orderAmount],
    queryFn: () => api.getAvailableRewards(customerId, orderAmount),
    enabled: !!customerId && orderAmount > 0,
  })

export const useCustomerOrders = (page = 1) =>
  useQuery({
    queryKey: ['customer-orders', page],
    queryFn: () => api.getCustomerOrders(page),
    staleTime: 30_000,
  })

export const usePlaceOrder = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (order: PlaceOrderRequest) => api.placeOrder(order),
    retry: 0,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer-orders'] }),
  })
}

export const useRedeemReward = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.redeemReward,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer-profile'] }),
  })
}
