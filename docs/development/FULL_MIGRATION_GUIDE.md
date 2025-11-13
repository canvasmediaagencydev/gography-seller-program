# Full TanStack Query Migration Guide

**Goal:** Migrate ALL pages to use TanStack Query
**Estimated Time:** 3-5 hours
**Status:** In Progress

---

## 📋 Migration Checklist

### ✅ Phase 1: Core (DONE)
- [x] Setup QueryClient Provider
- [x] Create all hooks (6 files)
- [x] Migrate Trips page
- [x] Add trip prefetching
- [x] Update Coin Balance component

### 🔥 Phase 2: High Priority Pages (NOW)
- [ ] 1. Admin Bookings page
- [ ] 2. Admin Sellers page
- [ ] 3. Dashboard stats
- [ ] 4. Reports page

### ⏳ Phase 3: Medium Priority
- [ ] 5. Admin Customers page
- [ ] 6. Coins Dashboard page
- [ ] 7. Profile pages

### 📦 Phase 4: Small Pages
- [ ] 8. Admin Trips management
- [ ] 9. Booking form
- [ ] 10. Trip details (if exists)
- [ ] 11. Settings pages

---

## 🎯 Migration Pattern (Template)

For each page, follow this pattern:

### Before (Old Pattern):
```typescript
'use client'

import { useState, useEffect } from 'react'

export default function Page() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/data')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error</div>

  return <div>{/* render */}</div>
}
```

### After (TanStack Query):
```typescript
'use client'

import { useData } from '@/hooks/use-data'

export default function Page() {
  const { data, isLoading, error } = useData()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error</div>

  return <div>{/* render */}</div>
}
```

**Lines of code:** ~40 → ~15 (60% reduction!)

---

## 1️⃣ Admin Bookings Page

### Current File
`src/app/dashboard/admin/bookings/AdminBookingsClient.tsx`

### Migration Steps

**Step 1: Replace imports**
```typescript
// Remove old hook
- import { useAdminBookings } from '@/hooks/useAdminBookings'

// Add new hooks
+ import { useBookings, useUpdateBookingStatus } from '@/hooks/use-bookings'
+ import { useQueryClient } from '@tanstack/react-query'
```

**Step 2: Replace hook usage**
```typescript
// Old
const {
  bookings,
  loading,
  error,
  refreshBookings,
  updateBookingInState
} = useAdminBookings(20)

// New
const { data, isLoading, error, isFetching } = useBookings({
  pageSize: 20,
  status: selectedStatus !== 'all' ? selectedStatus : undefined,
  searchTerm: searchTerm || undefined,
})

const bookings = data?.bookings || []
const totalCount = data?.totalCount || 0
```

**Step 3: Update status change function**
```typescript
// Old
const handleStatusChange = async (id, status) => {
  try {
    setLoading(true)
    await updateStatus(id, status)
    await refreshBookings()
  } catch (err) {
    toast.error('Failed')
  }
}

// New (Optimistic!)
const updateStatus = useUpdateBookingStatus()

const handleStatusChange = (id, status) => {
  updateStatus.mutate(
    { id, status },
    {
      onSuccess: () => toast.success('Updated!'),
      onError: () => toast.error('Failed')
    }
  )
  // UI updates instantly! No loading needed
}
```

**Step 4: Update loading states**
```typescript
// Old
{loading && <LoadingSpinner />}

// New
{isLoading && <LoadingSpinner />}
{isFetching && !isLoading && <RefreshingIndicator />}
```

**Expected Result:**
- ⚡ Instant status changes (optimistic)
- 🔄 Auto-refresh on window focus
- 📊 Smart caching (30s)

---

## 2️⃣ Admin Sellers Page

### Current File
`src/app/dashboard/admin/sellers/page.tsx` (likely)

### Migration Steps

**Step 1: Create sellers component (if needed)**
```typescript
// src/app/dashboard/admin/sellers/SellersClient.tsx
'use client'

import { useSellers, useUpdateSellerStatus } from '@/hooks/use-admin'
import { toast } from 'sonner'

export default function SellersClient() {
  const { data, isLoading, error } = useSellers()
  const updateStatus = useUpdateSellerStatus()

  const sellers = data?.sellers || []

  const handleApprove = (sellerId: string) => {
    updateStatus.mutate(
      { sellerId, status: 'approved' },
      {
        onSuccess: () => toast.success('Seller approved!'),
        onError: () => toast.error('Failed to approve')
      }
    )
    // UI changes instantly! ⚡
  }

  const handleReject = (sellerId: string) => {
    updateStatus.mutate(
      { sellerId, status: 'rejected' },
      {
        onSuccess: () => toast.success('Seller rejected'),
        onError: () => toast.error('Failed to reject')
      }
    )
  }

  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorMessage error={error} />

  return (
    <div className="space-y-4">
      <h1>Sellers Management</h1>

      <div className="grid gap-4">
        {sellers.map((seller) => (
          <div key={seller.id} className="p-4 border rounded">
            <div className="flex justify-between items-center">
              <div>
                <h3>{seller.full_name}</h3>
                <p className="text-sm text-gray-500">{seller.email}</p>
                <span className={`badge ${seller.status}`}>
                  {seller.status}
                </span>
              </div>

              {seller.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(seller.id)}
                    disabled={updateStatus.isPending}
                    className="btn btn-success"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(seller.id)}
                    disabled={updateStatus.isPending}
                    className="btn btn-danger"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Expected Result:**
- ⚡ Instant approve/reject (optimistic)
- 🔄 Auto-rollback on error
- 📊 Real-time status updates

---

## 3️⃣ Dashboard Stats

### Current Location
Likely in main dashboard page or widget components

### Migration

**Create dashboard page (if not exists):**
```typescript
// src/app/dashboard/admin/page.tsx or DashboardClient.tsx
'use client'

import { useDashboardData } from '@/hooks/use-dashboard'

export default function AdminDashboard() {
  const {
    bookingsStats,
    revenueStats,
    sellersStats,
    tripsStats,
    isLoading,
    isFetching
  } = useDashboardData()

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>

      {/* Stats Grid - All load in parallel! */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Bookings"
          value={bookingsStats?.total || 0}
          trend={bookingsStats?.trend}
          icon="📊"
        />
        <StatCard
          title="Revenue"
          value={`${(revenueStats?.total || 0).toLocaleString()} THB`}
          trend={revenueStats?.trend}
          icon="💰"
        />
        <StatCard
          title="Active Sellers"
          value={sellersStats?.active || 0}
          pending={sellersStats?.pending}
          icon="👥"
        />
        <StatCard
          title="Active Trips"
          value={tripsStats?.active || 0}
          total={tripsStats?.total}
          icon="✈️"
        />
      </div>

      {/* Refreshing indicator */}
      {isFetching && !isLoading && (
        <div className="text-sm text-blue-600">
          Updating stats...
        </div>
      )}

      {/* Other dashboard widgets */}
    </div>
  )
}

function StatCard({ title, value, trend, pending, total, icon }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={trend > 0 ? 'text-green-600' : 'text-red-600'}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <h3 className="text-sm text-gray-600">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {pending && (
        <p className="text-xs text-yellow-600 mt-1">
          {pending} pending
        </p>
      )}
      {total && (
        <p className="text-xs text-gray-500 mt-1">
          of {total} total
        </p>
      )}
    </div>
  )
}
```

**Expected Result:**
- ⚡ 70% faster (parallel queries)
- 🔄 Auto-refresh every minute
- 📊 Real-time updates

---

## 4️⃣ Reports Page

### Current File
`src/app/dashboard/reports/page.tsx`

### Migration

```typescript
'use client'

import { useState } from 'react'
import { useSellerReport, useCommissionSummary } from '@/hooks/use-reports'
import { useUser } from '@/hooks/use-user' // Assuming this exists

export default function ReportsPage() {
  const { user } = useUser()
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })

  const { data: report, isLoading: reportLoading } = useSellerReport(
    user?.id || '',
    dateRange
  )

  const { data: commission, isLoading: commissionLoading } = useCommissionSummary(
    user?.id || ''
  )

  if (reportLoading || commissionLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <h1>My Reports</h1>

      {/* Date Range Filter */}
      <div className="flex gap-4">
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          className="input"
        />
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          className="input"
        />
      </div>

      {/* Commission Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <h3>Total Earned</h3>
          <p className="text-2xl font-bold">
            {commission?.total_earned?.toLocaleString() || 0} THB
          </p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {commission?.pending?.toLocaleString() || 0} THB
          </p>
        </div>
        <div className="stat-card">
          <h3>Paid</h3>
          <p className="text-2xl font-bold text-green-600">
            {commission?.paid?.toLocaleString() || 0} THB
          </p>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Trip</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Commission</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {report?.bookings?.map((booking) => (
              <tr key={booking.id} className="border-t">
                <td className="px-4 py-3">
                  {new Date(booking.created_at).toLocaleDateString('th-TH')}
                </td>
                <td className="px-4 py-3">{booking.customer_name}</td>
                <td className="px-4 py-3">{booking.trip_title}</td>
                <td className="px-4 py-3 text-right">
                  {booking.amount.toLocaleString()} THB
                </td>
                <td className="px-4 py-3 text-right font-bold text-green-600">
                  {booking.commission.toLocaleString()} THB
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`badge ${booking.status}`}>
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

**Expected Result:**
- 📊 5-minute caching (reports don't change often)
- 🔄 Auto-refresh on window focus
- ⚡ Instant filter updates

---

## 5️⃣ Admin Customers Page

### Migration Template

```typescript
'use client'

import { useCustomers } from '@/hooks/use-admin'

export default function CustomersPage() {
  const { data, isLoading, error } = useCustomers()

  const customers = data?.customers || []

  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorMessage error={error} />

  return (
    <div className="space-y-4">
      <h1>Customers ({customers.length})</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-center">Bookings</th>
              <th className="px-4 py-3 text-left">Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{customer.full_name}</td>
                <td className="px-4 py-3">{customer.email}</td>
                <td className="px-4 py-3">{customer.phone || '-'}</td>
                <td className="px-4 py-3 text-center">
                  {customer.bookings_count || 0}
                </td>
                <td className="px-4 py-3">
                  {new Date(customer.created_at).toLocaleDateString('th-TH')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

## 6️⃣ Coins Dashboard

### Current File
`src/app/dashboard/coins/page.tsx`

### Migration

**Already using hooks! Just verify:**
```typescript
// Should be using
import { useCoinBalance, useCoinTransactions, useCoinCampaigns } from '@/hooks/use-coins'

// If not, update to:
const { data: balance } = useCoinBalance()
const { data: transactions } = useCoinTransactions()
const { data: campaigns } = useCoinCampaigns()
```

---

## 7️⃣ Profile Pages

### Migration Template

```typescript
'use client'

import { useProfile, useUpdateProfile } from '@/hooks/use-profile' // Need to create

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()

  const handleSubmit = (formData) => {
    updateProfile.mutate(formData, {
      onSuccess: () => toast.success('Profile updated!'),
      onError: () => toast.error('Failed to update')
    })
    // UI updates instantly with optimistic update!
  }

  if (isLoading) return <LoadingSkeleton />

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button
        type="submit"
        disabled={updateProfile.isPending}
      >
        {updateProfile.isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
```

---

## 🧪 Testing Checklist

After each migration:

- [ ] Page loads without errors
- [ ] Data displays correctly
- [ ] Loading states work
- [ ] Error states work
- [ ] Mutations work (create/update/delete)
- [ ] Optimistic updates work
- [ ] Cache invalidation works
- [ ] No console errors
- [ ] Build passes

---

## 🚀 Performance Verification

After all migrations:

```bash
# 1. Build test
npm run build
# Should pass with no errors

# 2. Lighthouse audit
npm run build && npm start
# Chrome DevTools > Lighthouse > Performance
# Target: 90+ score

# 3. Network analysis
# Open Network tab
# Navigate between pages
# Check for:
  - Request deduplication
  - Cache hits
  - Prefetch requests
```

---

## 📊 Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Page Load | 2-3s | 0.5-1s | **70%** |
| Navigation | 1-2s | Instant | **100%** |
| Status Changes | 1-2s | Instant | **100%** |
| API Calls/Session | 200+ | 60-80 | **65%** |

---

## ✅ Final Checklist

- [ ] All pages migrated
- [ ] All old hooks removed
- [ ] Build passes
- [ ] Tests pass (if any)
- [ ] Performance metrics improved
- [ ] No console errors
- [ ] Documentation updated

---

## 🎉 Done!

When complete, you'll have:
- ✅ 100% TanStack Query coverage
- ✅ 50-70% performance improvement
- ✅ Optimistic updates everywhere
- ✅ Smart caching system-wide
- ✅ 60% less API calls
- ✅ Better user experience
- ✅ Cleaner codebase

**Congratulations! 🚀**
