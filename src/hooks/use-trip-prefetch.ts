import { useQueryClient } from '@tanstack/react-query'
import { tripKeys } from './use-trips'

/**
 * Hook for prefetching trip details
 * Use this to preload trip data on hover/touch for instant navigation
 */
export function useTripPrefetch() {
  const queryClient = useQueryClient()

  const prefetchTrip = (tripId: string) => {
    queryClient.prefetchQuery({
      queryKey: tripKeys.detail(tripId),
      queryFn: async () => {
        const res = await fetch(`/api/trips/${tripId}`)
        if (!res.ok) throw new Error('Failed to fetch trip')
        return res.json()
      },
      staleTime: 60000, // 1 minute - adjust based on your needs
    })
  }

  const prefetchMultipleTrips = (tripIds: string[]) => {
    tripIds.forEach(id => prefetchTrip(id))
  }

  return {
    prefetchTrip,
    prefetchMultipleTrips
  }
}
