# Admin Bookings with TanStack Query - Example Usage

## Overview
This guide shows how to use the updated booking hooks with TanStack Query for the Admin Bookings page.

## Available Hooks

### 1. `useBookings` - Fetch bookings with filters
Fetch paginated bookings with various filters.

```typescript
import { useBookings } from '@/hooks/use-bookings'

function AdminBookingsPage() {
  const { data, isLoading, error, isFetching } = useBookings({
    status: 'pending',
    sellerId: 'seller-id',
    tripId: 'trip-id',
    searchTerm: 'John',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    page: 1,
    pageSize: 20,
  })

  const bookings = data?.bookings || []
  const totalCount = data?.totalCount || 0

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {isFetching && <div>Updating...</div>}
      {bookings.map(booking => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  )
}
```

### 2. `useInfiniteBookings` - Infinite scroll / Load more
For "Load More" button functionality.

```typescript
import { useInfiniteBookings } from '@/hooks/use-bookings'

function AdminBookingsPage() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteBookings({
    status: 'approved',
    pageSize: 20,
  })

  const allBookings = data?.pages.flatMap(page => page.bookings) || []

  return (
    <div>
      {allBookings.map(booking => (
        <BookingCard key={booking.id} booking={booking} />
      ))}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading more...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

### 3. `useBookingStats` - Get booking statistics
Fetch booking statistics with auto-refresh.

```typescript
import { useBookingStats } from '@/hooks/use-bookings'

function BookingStatsComponent() {
  const { data: stats, isLoading } = useBookingStats()

  if (isLoading) return <div>Loading stats...</div>

  return (
    <div className="grid grid-cols-4 gap-4">
      <div>
        <h3>Total Bookings</h3>
        <p>{stats?.total || 0}</p>
      </div>
      <div>
        <h3>Pending</h3>
        <p>{stats?.pending || 0}</p>
      </div>
      <div>
        <h3>Approved</h3>
        <p>{stats?.approved || 0}</p>
      </div>
      <div>
        <h3>Revenue</h3>
        <p>{stats?.totalRevenue || 0} THB</p>
      </div>
    </div>
  )
}
```

### 4. `useUpdateBookingStatus` - Update status with optimistic updates
Update booking status with instant UI feedback (before API response).

```typescript
import { useUpdateBookingStatus } from '@/hooks/use-bookings'
import { toast } from 'sonner'

function BookingCard({ booking }) {
  const updateStatus = useUpdateBookingStatus()

  const handleApprove = async () => {
    try {
      await updateStatus.mutateAsync({
        id: booking.id,
        status: 'approved'
      })
      toast.success('Booking approved!')
    } catch (error) {
      toast.error('Failed to approve booking')
    }
  }

  return (
    <div>
      <h3>{booking.customer_name}</h3>
      <p>Status: {booking.status}</p>

      <button
        onClick={handleApprove}
        disabled={updateStatus.isPending}
      >
        {updateStatus.isPending ? 'Approving...' : 'Approve'}
      </button>
    </div>
  )
}
```

## Complete Example: Admin Bookings Client Component

```typescript
'use client'

import { useState } from 'react'
import { useBookings, useUpdateBookingStatus, useBookingStats } from '@/hooks/use-bookings'
import { toast } from 'sonner'

export default function AdminBookingsClient() {
  const [filters, setFilters] = useState({
    status: 'all',
    searchTerm: '',
    page: 1,
    pageSize: 20,
  })

  // Fetch bookings
  const { data, isLoading, error, isFetching } = useBookings(
    filters.status !== 'all' ? filters : { ...filters, status: undefined }
  )

  // Get stats
  const { data: stats } = useBookingStats()

  // Update booking status
  const updateStatus = useUpdateBookingStatus()

  const bookings = data?.bookings || []
  const totalCount = data?.totalCount || 0
  const totalPages = Math.ceil(totalCount / filters.pageSize)

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id: bookingId, status: newStatus })
      toast.success(`Booking ${newStatus}!`)
    } catch (error) {
      toast.error('Failed to update booking status')
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  if (isLoading) {
    return <div className="p-8">Loading bookings...</div>
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total</h3>
          <p className="text-2xl font-bold">{stats?.total || 0}</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm text-blue-700">Pending</h3>
          <p className="text-2xl font-bold text-blue-600">{stats?.pending || 0}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="text-sm text-green-700">Approved</h3>
          <p className="text-2xl font-bold text-green-600">{stats?.approved || 0}</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="text-sm text-purple-700">Revenue</h3>
          <p className="text-2xl font-bold text-purple-600">
            {stats?.totalRevenue?.toLocaleString() || 0} THB
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input
          type="text"
          placeholder="Search by customer name..."
          value={filters.searchTerm}
          onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          className="px-4 py-2 border rounded-lg flex-1"
        />
      </div>

      {/* Loading indicator when filtering */}
      {isFetching && !isLoading && (
        <div className="text-sm text-blue-600">Updating results...</div>
      )}

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="p-4 bg-white rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">{booking.customers?.full_name}</h3>
                <p className="text-sm text-gray-500">
                  {booking.trip_schedules?.trips?.title}
                </p>
                <p className="text-xs text-gray-400">
                  {booking.trip_schedules?.departure_date}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange(booking.id, 'approved')}
                  disabled={updateStatus.isPending}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatusChange(booking.id, 'rejected')}
                  disabled={updateStatus.isPending}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>

            <div className="mt-2">
              <span className={`
                px-2 py-1 text-xs rounded-full
                ${booking.status === 'approved' ? 'bg-green-100 text-green-700' : ''}
                ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                ${booking.status === 'rejected' ? 'bg-red-100 text-red-700' : ''}
              `}>
                {booking.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => handleFilterChange('page', filters.page - 1)}
            disabled={filters.page === 1}
            className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>

          <span className="px-4 py-2">
            Page {filters.page} of {totalPages}
          </span>

          <button
            onClick={() => handleFilterChange('page', filters.page + 1)}
            disabled={filters.page === totalPages}
            className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
```

## Features

### ✅ Optimistic Updates
- UI updates instantly when changing booking status
- Automatic rollback if the update fails
- No loading spinner needed for status changes

### ✅ Smart Caching
- Data cached for 30 seconds (configurable)
- Automatic refetch on window focus
- Request deduplication

### ✅ Real-time Stats
- Stats refresh every 60 seconds
- Invalidated after status changes

### ✅ Filtering & Search
- Multiple filter options
- Query keys automatically handle cache separation
- Instant filter updates

### ✅ Pagination
- Server-side pagination
- Can switch to infinite scroll with `useInfiniteBookings`

## Benefits Over Old Implementation

1. **Less Code**: ~50% reduction in component code
2. **Better UX**: Optimistic updates = instant feedback
3. **Performance**: Automatic caching and deduplication
4. **Developer Experience**: Built-in loading/error states
5. **Maintainability**: Centralized data fetching logic

## Migration from Old Hook

If you're using the old `useAdminBookings` hook:

```typescript
// Old
const { bookings, loading, error, refreshBookings } = useAdminBookings(20)

// New
const { data, isLoading, error, refetch } = useBookings({ pageSize: 20 })
const bookings = data?.bookings || []
```

The new hook is more flexible and provides better TypeScript support.
