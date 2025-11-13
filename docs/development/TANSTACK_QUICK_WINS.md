# TanStack Query - Quick Wins Implementation Guide

## 🎯 สถานะปัจจุบัน (ณ วันที่ 2025-11-13)

### ✅ ทำเสร็จแล้ว
1. ✅ **Setup TanStack Query** - QueryClient Provider พร้อมใช้งาน
2. ✅ **Trips Page** - ใช้ `useTrips` hook พร้อม pagination & filters
3. ✅ **Coin Balance** - Auto-refresh ทุก 30 วินาที
4. ✅ **Bookings Hooks** - พร้อม Optimistic Updates & Infinite Scroll

### 📦 Hooks ที่พร้อมใช้งาน
```
src/hooks/
├── use-trips.ts         ✅ พร้อม (pagination, filters)
├── use-bookings.ts      ✅ พร้อม (optimistic updates, infinite scroll)
├── use-coins.ts         ✅ พร้อม (balance, transactions, campaigns)
└── use-admin.ts         ✅ พร้อม (sellers, customers, trips)
```

---

## 🚀 Quick Wins - เรียงตามลำดับความง่าย & ผลลัพธ์

### 1. ⚡ เพิ่ม Prefetching ให้ Trips Page (15 นาที)
**ผลลัพธ์:** เมื่อ hover บน trip card → โหลด details ทันที → กดดู = แสดงทันที!

**สร้างไฟล์ใหม่:** `src/hooks/use-trip-prefetch.ts`
```typescript
import { useQueryClient } from '@tanstack/react-query'
import { tripKeys } from './use-trips'

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
      staleTime: 60000, // 1 minute
    })
  }

  return { prefetchTrip }
}
```

**อัปเดต:** `src/components/TripCard.tsx`
```typescript
// เพิ่ม import
import { useTripPrefetch } from '@/hooks/use-trip-prefetch'

// ใน component
const { prefetchTrip } = useTripPrefetch()

// เพิ่มใน Link หรือ card wrapper
<Link
  href={`/trip/${trip.id}`}
  onMouseEnter={() => prefetchTrip(trip.id)}
  onTouchStart={() => prefetchTrip(trip.id)}  // สำหรับ mobile
>
  {/* existing code */}
</Link>
```

**Test:** Hover บน trip card → เปิด Network tab → เห็น request ทันที!

---

### 2. ⚡ เพิ่ม Pagination Prefetch (10 นาที)
**ผลลัพธ์:** โหลด next page ล่วงหน้า → กด next = แสดงทันที!

**อัปเดต:** `src/app/dashboard/trips/page.tsx`
```typescript
import { useQueryClient } from '@tanstack/react-query'
import { tripKeys } from '@/hooks/use-trips'

// ใน component
const queryClient = useQueryClient()

// Prefetch next page
useEffect(() => {
  if (currentPage < totalPages) {
    queryClient.prefetchQuery({
      queryKey: tripKeys.list({
        page: currentPage + 1,
        pageSize,
        filter: activeTab,
        countries: selectedCountries,
        partners: selectedPartners,
      }),
      queryFn: async () => {
        const params = new URLSearchParams({
          page: (currentPage + 1).toString(),
          pageSize: pageSize.toString(),
          filter: activeTab,
        })
        if (selectedCountries.length > 0) {
          params.append('countries', selectedCountries.join(','))
        }
        if (selectedPartners.length > 0) {
          params.append('partners', selectedPartners.join(','))
        }
        const response = await fetch(`/api/trips?${params}`)
        return response.json()
      },
    })
  }
}, [currentPage, totalPages, activeTab, selectedCountries, selectedPartners])
```

---

### 3. ⚡ Admin Sellers - Optimistic Updates (30 นาที)
**ผลลัพธ์:** Approve/Reject seller = UI เปลี่ยนทันที!

**อัปเดต:** `src/hooks/use-admin.ts`
```typescript
// เพิ่ม optimistic update function
export function useUpdateSellerStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sellerId, status }: { sellerId: string; status: string }) => {
      const response = await fetch(`/api/admin/sellers/${sellerId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Failed to update seller status')
      return response.json()
    },
    // Optimistic update
    onMutate: async ({ sellerId, status }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.sellers })
      const previousSellers = queryClient.getQueryData(adminKeys.sellers)

      queryClient.setQueryData(adminKeys.sellers, (old: any) => {
        if (!old) return old
        return {
          ...old,
          sellers: old.sellers?.map((seller: any) =>
            seller.id === sellerId ? { ...seller, status } : seller
          ),
        }
      })

      return { previousSellers }
    },
    onError: (err, variables, context) => {
      if (context?.previousSellers) {
        queryClient.setQueryData(adminKeys.sellers, context.previousSellers)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.sellers })
    },
  })
}
```

**ใช้งานใน component:**
```typescript
const updateStatus = useUpdateSellerStatus()

const handleApprove = (sellerId: string) => {
  updateStatus.mutate({ sellerId, status: 'approved' })
  // UI updates instantly! ⚡
}
```

---

### 4. ⚡ Dashboard Stats - Parallel Queries (20 นาที)
**ผลลัพธ์:** โหลดหลาย widgets พร้อมกัน = เร็วขึ้น 50%!

**สร้างไฟล์:** `src/hooks/use-dashboard.ts`
```typescript
import { useQueries } from '@tanstack/react-query'

export function useDashboardData() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['dashboard', 'bookings-stats'],
        queryFn: async () => {
          const res = await fetch('/api/admin/bookings/stats')
          return res.json()
        },
        staleTime: 60000, // 1 minute
      },
      {
        queryKey: ['dashboard', 'revenue-stats'],
        queryFn: async () => {
          const res = await fetch('/api/admin/revenue/stats')
          return res.json()
        },
        staleTime: 60000,
      },
      {
        queryKey: ['dashboard', 'sellers-stats'],
        queryFn: async () => {
          const res = await fetch('/api/admin/sellers/stats')
          return res.json()
        },
        staleTime: 60000,
      },
      {
        queryKey: ['dashboard', 'trips-stats'],
        queryFn: async () => {
          const res = await fetch('/api/admin/trips/stats')
          return res.json()
        },
        staleTime: 60000,
      },
    ],
  })

  return {
    bookingsStats: results[0].data,
    revenueStats: results[1].data,
    sellersStats: results[2].data,
    tripsStats: results[3].data,
    isLoading: results.some(r => r.isLoading),
    isError: results.some(r => r.isError),
  }
}
```

**ใช้งาน:**
```typescript
function AdminDashboard() {
  const {
    bookingsStats,
    revenueStats,
    sellersStats,
    tripsStats,
    isLoading,
  } = useDashboardData()

  if (isLoading) return <LoadingSkeleton />

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard title="Bookings" data={bookingsStats} />
      <StatCard title="Revenue" data={revenueStats} />
      <StatCard title="Sellers" data={sellersStats} />
      <StatCard title="Trips" data={tripsStats} />
    </div>
  )
}
```

---

### 5. ⚡ Reports - Caching & Background Refresh (25 นาที)
**ผลลัพธ์:** Reports โหลดเร็วขึ้น + auto-refresh

**สร้างไฟล์:** `src/hooks/use-reports.ts`
```typescript
import { useQuery } from '@tanstack/react-query'

export const reportKeys = {
  all: ['reports'] as const,
  seller: (sellerId: string, dateRange?: { start: string; end: string }) =>
    [...reportKeys.all, 'seller', sellerId, dateRange] as const,
  commission: (sellerId: string) => [...reportKeys.all, 'commission', sellerId] as const,
}

export function useSellerReport(sellerId: string, dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: reportKeys.seller(sellerId, dateRange),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateRange) {
        params.append('start', dateRange.start)
        params.append('end', dateRange.end)
      }
      const res = await fetch(`/api/reports/seller/${sellerId}?${params}`)
      if (!res.ok) throw new Error('Failed to fetch report')
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (reports ไม่ต้อง real-time มาก)
    refetchOnWindowFocus: true, // Refresh เมื่อกลับมาที่หน้า
  })
}

export function useCommissionSummary(sellerId: string) {
  return useQuery({
    queryKey: reportKeys.commission(sellerId),
    queryFn: async () => {
      const res = await fetch(`/api/reports/commission/${sellerId}`)
      if (!res.ok) throw new Error('Failed to fetch commission')
      return res.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000, // Auto-refresh ทุก 2 นาที
  })
}
```

---

## 📊 ผลลัพธ์ที่คาดหวัง

### Before (ไม่มี TanStack Query)
- Trip hover → click → รอ 1-2 วินาที
- Next page → รอ 1-2 วินาที
- Approve seller → loading 1-2 วินาที
- Dashboard → โหลดทีละ widget (4-6 วินาที รวม)
- Reports → โหลดช้า (2-3 วินาที)

### After (มี TanStack Query + Quick Wins)
- Trip hover → click → **แสดงทันที** ⚡
- Next page → **แสดงทันที** ⚡
- Approve seller → **UI เปลี่ยนทันที** ⚡
- Dashboard → โหลดพร้อมกัน (**1-2 วินาที**)
- Reports → cache + auto-refresh (**0.5-1 วินาที**)

**Total Improvement: 60-70% เร็วขึ้น!** 🚀

---

## 🎯 Next Steps (ถ้าต้องการทำต่อ)

### Phase 2: Medium Priority
1. **Admin Bookings Component Migration** (1 ช.ม.)
   - แทนที่ `useAdminBookings` ด้วย `useBookings` + `useInfiniteBookings`
   - Test optimistic updates

2. **Coins Dashboard Update** (30 นาที)
   - ใช้ hooks ที่มีอยู่แล้ว
   - เพิ่ม real-time updates

3. **Profile Optimistic Updates** (45 นาที)
   - อัปเดต profile = เห็นผลทันที
   - Avatar upload progress

### Phase 3: Advanced
1. **Service Worker Caching** (2 ช.ม.)
   - Offline support
   - Background sync

2. **Optimistic Image Uploads** (1 ช.ม.)
   - Show preview ทันที
   - Upload ใน background

---

## 🐛 Troubleshooting

### ปัญหา: Prefetch ไม่ทำงาน
```typescript
// ตรวจสอบว่า queryKey ตรงกันไหม
console.log('Prefetch key:', tripKeys.detail(tripId))
console.log('Page key:', tripKeys.detail(tripId))
// ต้องเหมือนกัน 100%!
```

### ปัญหา: Optimistic update ไม่ rollback
```typescript
// ตรวจสอบว่า onError มี context
onError: (err, variables, context) => {
  console.log('Context:', context)  // ต้องไม่เป็น undefined
  if (context?.previousData) {
    queryClient.setQueryData(key, context.previousData)
  }
}
```

### ปัญหา: Cache ไม่ clear
```typescript
// Clear specific cache
queryClient.invalidateQueries({ queryKey: ['trips'] })

// Clear all
queryClient.clear()
```

---

## 📚 Resources

- [Project Implementation Doc](./TANSTACK_QUERY_IMPLEMENTATION.md)
- [System-wide Optimization Plan](./TANSTACK_SYSTEM_WIDE_OPTIMIZATION.md)
- [Admin Bookings Example](./ADMIN_BOOKINGS_TANSTACK_EXAMPLE.md)
- [TanStack Query Docs](https://tanstack.com/query/latest)

---

## ✅ Implementation Checklist

### Quick Wins (1-2 ชั่วโมง)
- [ ] เพิ่ม trip prefetching (15 min)
- [ ] เพิ่ม pagination prefetch (10 min)
- [ ] Admin sellers optimistic updates (30 min)
- [ ] Dashboard parallel queries (20 min)
- [ ] Reports caching (25 min)

### Medium Wins (3-4 ชั่วโมง)
- [ ] Migrate Admin Bookings component
- [ ] Update Coins Dashboard
- [ ] Profile optimistic updates
- [ ] Admin Customers hooks
- [ ] Admin Trips management

### Advanced (ถ้ามีเวลา)
- [ ] Service Worker
- [ ] Image upload optimization
- [ ] Request batching
- [ ] Performance monitoring

---

**Happy Optimizing! 🚀**
