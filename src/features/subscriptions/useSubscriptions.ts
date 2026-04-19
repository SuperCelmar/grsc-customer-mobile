import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export const useSubscriptions = () =>
  useQuery({
    queryKey: ['subscriptions'],
    queryFn: api.getSubscriptions,
    staleTime: 60_000,
  })
