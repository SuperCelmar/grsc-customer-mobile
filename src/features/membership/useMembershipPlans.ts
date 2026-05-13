import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'

export const useMembershipPlans = () =>
  useQuery({
    queryKey: ['membership-plans'],
    queryFn: api.getMembershipPlans,
    staleTime: 60_000,
  })

export const usePurchaseMembership = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.purchaseMembership,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-profile'] })
    },
  })
}
