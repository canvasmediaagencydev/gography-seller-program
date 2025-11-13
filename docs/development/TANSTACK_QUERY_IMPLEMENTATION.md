# TanStack Query Implementation Task

## Overview
Implement TanStack Query (React Query) to improve data fetching, caching, and state management in the Next.js application.

## Benefits
- **Better Caching**: Automatic cache management with stale-while-revalidate
- **Performance**: Request deduplication, background refetching
- **Developer Experience**: Loading/error states, optimistic updates
- **Real-time Updates**: Automatic refetch on window focus, network reconnect
- **SSR Support**: Works seamlessly with Next.js Server Components

## Implementation Plan

### 1. Installation

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### 2. Setup QueryClient Provider

**File**: `src/app/providers.tsx` (new file)

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

**Update**: `src/app/layout.tsx`
- Wrap children with `<Providers>`

### 3. Create Custom Hooks

#### 3.1 Trips Hooks
**File**: `src/hooks/use-trips.ts` (new file)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Trip } from '@/types/trip'

// Query Keys
export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (filters?: any) => [...tripKeys.lists(), filters] as const,
  details: () => [...tripKeys.all, 'detail'] as const,
  detail: (id: string) => [...tripKeys.details(), id] as const,
}

// Fetch trips
export function useTrips() {
  return useQuery({
    queryKey: tripKeys.lists(),
    queryFn: async () => {
      const response = await fetch('/api/trips')
      if (!response.ok) throw new Error('Failed to fetch trips')
      return response.json()
    },
  })
}

// Fetch single trip
export function useTrip(tripId: string) {
  return useQuery({
    queryKey: tripKeys.detail(tripId),
    queryFn: async () => {
      const response = await fetch(`/api/trips/${tripId}`)
      if (!response.ok) throw new Error('Failed to fetch trip')
      return response.json()
    },
    enabled: !!tripId,
  })
}

// Create trip mutation
export function useCreateTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (trip: Partial<Trip>) => {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trip),
      })
      if (!response.ok) throw new Error('Failed to create trip')
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch trips list
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() })
    },
  })
}

// Update trip mutation
export function useUpdateTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...trip }: Partial<Trip> & { id: string }) => {
      const response = await fetch(`/api/trips/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trip),
      })
      if (!response.ok) throw new Error('Failed to update trip')
      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate specific trip and list
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() })
    },
  })
}

// Delete trip mutation
export function useDeleteTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tripId: string) => {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete trip')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() })
    },
  })
}
```

#### 3.2 Bookings Hooks
**File**: `src/hooks/use-bookings.ts` (new file)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (filters?: any) => [...bookingKeys.lists(), filters] as const,
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
}

export function useBookings() {
  return useQuery({
    queryKey: bookingKeys.lists(),
    queryFn: async () => {
      const response = await fetch('/api/admin/bookings')
      if (!response.ok) throw new Error('Failed to fetch bookings')
      return response.json()
    },
  })
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/admin/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Failed to update booking')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
    },
  })
}
```

#### 3.3 Coins Hooks
**File**: `src/hooks/use-coins.ts` (new file)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const coinKeys = {
  all: ['coins'] as const,
  balance: () => [...coinKeys.all, 'balance'] as const,
  transactions: () => [...coinKeys.all, 'transactions'] as const,
  campaigns: () => [...coinKeys.all, 'campaigns'] as const,
  redemptions: () => [...coinKeys.all, 'redemptions'] as const,
}

export function useCoinBalance() {
  return useQuery({
    queryKey: coinKeys.balance(),
    queryFn: async () => {
      const response = await fetch('/api/coins')
      if (!response.ok) throw new Error('Failed to fetch coin balance')
      return response.json()
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  })
}

export function useCoinTransactions() {
  return useQuery({
    queryKey: coinKeys.transactions(),
    queryFn: async () => {
      const response = await fetch('/api/coins/transactions')
      if (!response.ok) throw new Error('Failed to fetch transactions')
      return response.json()
    },
  })
}

export function useCoinCampaigns() {
  return useQuery({
    queryKey: coinKeys.campaigns(),
    queryFn: async () => {
      const response = await fetch('/api/coins/campaigns')
      if (!response.ok) throw new Error('Failed to fetch campaigns')
      return response.json()
    },
  })
}

export function useRedeemCoins() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (amount: number) => {
      const response = await fetch('/api/coins/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      if (!response.ok) throw new Error('Failed to redeem coins')
      return response.json()
    },
    onSuccess: () => {
      // Invalidate balance and transactions
      queryClient.invalidateQueries({ queryKey: coinKeys.balance() })
      queryClient.invalidateQueries({ queryKey: coinKeys.transactions() })
    },
  })
}
```

#### 3.4 Admin Hooks
**File**: `src/hooks/use-admin.ts` (new file)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const adminKeys = {
  sellers: ['admin', 'sellers'] as const,
  customers: ['admin', 'customers'] as const,
  coinRedemptions: ['admin', 'coin-redemptions'] as const,
}

export function useSellers() {
  return useQuery({
    queryKey: adminKeys.sellers,
    queryFn: async () => {
      const response = await fetch('/api/admin/sellers')
      if (!response.ok) throw new Error('Failed to fetch sellers')
      return response.json()
    },
  })
}

export function useUpdateSellerStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sellerId,
      status
    }: {
      sellerId: string
      status: string
    }) => {
      const response = await fetch(`/api/admin/sellers/${sellerId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Failed to update seller status')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.sellers })
    },
  })
}
```

### 4. Usage in Components

#### Example: Trips Page
**File**: `src/app/dashboard/trips/page.tsx`

```typescript
'use client'

import { useTrips, useDeleteTrip } from '@/hooks/use-trips'
import { Button } from '@/components/ui/button'

export default function TripsPage() {
  const { data: trips, isLoading, error } = useTrips()
  const deleteTrip = useDeleteTrip()

  if (isLoading) return <div>Loading trips...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>My Trips</h1>
      {trips?.map((trip) => (
        <div key={trip.id}>
          <h2>{trip.title}</h2>
          <Button
            onClick={() => deleteTrip.mutate(trip.id)}
            disabled={deleteTrip.isPending}
          >
            {deleteTrip.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      ))}
    </div>
  )
}
```

#### Example: Coin Balance Component
**File**: `src/components/coins/CoinBalanceIndicator.tsx`

```typescript
'use client'

import { useCoinBalance } from '@/hooks/use-coins'

export function CoinBalanceIndicator() {
  const { data, isLoading } = useCoinBalance()

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="flex items-center gap-2">
      <span>💰</span>
      <span>{data?.balance || 0} Coins</span>
    </div>
  )
}
```

### 5. Optimistic Updates Example

For better UX, implement optimistic updates:

```typescript
export function useOptimisticUpdateTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...trip }: Partial<Trip> & { id: string }) => {
      const response = await fetch(`/api/trips/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trip),
      })
      if (!response.ok) throw new Error('Failed to update trip')
      return response.json()
    },
    // Optimistic update
    onMutate: async (newTrip) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tripKeys.detail(newTrip.id) })

      // Snapshot previous value
      const previousTrip = queryClient.getQueryData(tripKeys.detail(newTrip.id))

      // Optimistically update
      queryClient.setQueryData(tripKeys.detail(newTrip.id), newTrip)

      // Return context with snapshot
      return { previousTrip }
    },
    // Rollback on error
    onError: (err, newTrip, context) => {
      queryClient.setQueryData(
        tripKeys.detail(newTrip.id),
        context?.previousTrip
      )
    },
    // Refetch after success or error
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(variables.id) })
    },
  })
}
```

### 6. Prefetching Example

Prefetch data on hover for instant navigation:

```typescript
import { useQueryClient } from '@tanstack/react-query'
import { tripKeys } from '@/hooks/use-trips'

function TripCard({ trip }) {
  const queryClient = useQueryClient()

  const prefetchTrip = () => {
    queryClient.prefetchQuery({
      queryKey: tripKeys.detail(trip.id),
      queryFn: async () => {
        const response = await fetch(`/api/trips/${trip.id}`)
        return response.json()
      },
    })
  }

  return (
    <div onMouseEnter={prefetchTrip}>
      <Link href={`/trips/${trip.id}`}>
        {trip.title}
      </Link>
    </div>
  )
}
```

## Migration Strategy

### Phase 1: Setup (Day 1)
- [ ] Install packages
- [ ] Create Providers component
- [ ] Update root layout
- [ ] Setup dev tools

### Phase 2: Core Hooks (Day 2-3)
- [ ] Create trips hooks
- [ ] Create bookings hooks
- [ ] Create coins hooks
- [ ] Create admin hooks

### Phase 3: Component Updates (Day 4-6)
- [ ] Update trips pages
- [ ] Update admin dashboard
- [ ] Update coin components
- [ ] Update booking forms

### Phase 4: Testing & Optimization (Day 7)
- [ ] Test all features
- [ ] Verify performance improvements
- [ ] Add optimistic updates where needed
- [ ] Add prefetching for key pages
- [ ] Remove old cache system if no longer needed

## Performance Monitoring

### Before Implementation
Run these commands to measure baseline:
```bash
# Lighthouse audit
npm run build && npm start
# Use Chrome DevTools Lighthouse

# Check bundle size
npm run build
# Note .next/static bundle sizes
```

### After Implementation
- Compare Lighthouse scores
- Monitor bundle size increase (~50KB for TanStack Query)
- Check Network tab for request deduplication
- Verify cache hit rates in React Query DevTools

## Troubleshooting

### Common Issues

1. **Hydration errors with Server Components**
   - Make sure to use `'use client'` directive in components using hooks
   - Keep Server Components for initial data fetching when possible

2. **Stale data showing**
   - Adjust `staleTime` based on data freshness requirements
   - Use `invalidateQueries` after mutations

3. **Too many re-renders**
   - Check `refetchOnWindowFocus` settings
   - Use `enabled` option to conditionally fetch

## Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Next.js Integration Guide](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
- [Best Practices](https://tkdodo.eu/blog/practical-react-query)

## Notes

- Current in-memory cache (`@/lib/cache.ts`) can be kept for API routes
- TanStack Query handles client-side caching
- Consider keeping API route caching for server-side performance
- Dev tools will be available in development mode only
