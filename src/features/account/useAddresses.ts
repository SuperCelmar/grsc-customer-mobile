import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.listAddresses(),
    staleTime: 60_000,
  })
}
