# TanStack Query System-Wide Performance Optimization Plan

## 🎯 เป้าหมาย
ปรับปรุงประสิทธิภาพทั้งระบบด้วย TanStack Query เพื่อให้:
- โหลดหน้าเร็วขึ้น 50-70%
- UI responsive ขึ้น (optimistic updates)
- ลด network requests (caching + deduplication)
- Developer experience ดีขึ้น

---

## 📊 Current Status

### ✅ Already Implemented
1. ✅ Trips Page (`/dashboard/trips`) - with pagination & filters
2. ✅ Coin Balance Indicator - auto-refresh every 30s
3. ✅ Bookings Hooks - with optimistic updates & infinite scroll

### 🔄 Need to Implement
- Admin Bookings page
- Admin Sellers page
- Admin Customers page
- Admin Trips page
- Seller Reports page
- Coins Dashboard
- Profile pages
- และอื่นๆ อีกหลายหน้า

---

## 🚀 Optimization Strategies

### 1. **Prefetching (โหลดข้อมูลล่วงหน้า)**
ลดเวลารอเมื่อ user คลิกหรือ navigate

#### A. Hover Prefetch (โหลดเมื่อ hover)
```typescript
// ตัวอย่าง: Trip Card
import { useQueryClient } from '@tanstack/react-query'
import { tripKeys } from '@/hooks/use-trips'

function TripCard({ trip }) {
  const queryClient = useQueryClient()

  const prefetchTrip = () => {
    queryClient.prefetchQuery({
      queryKey: tripKeys.detail(trip.id),
      queryFn: async () => {
        const res = await fetch(`/api/trips/${trip.id}`)
        return res.json()
      },
    })
  }

  return (
    <Link
      href={`/trips/${trip.id}`}
      onMouseEnter={prefetchTrip}  // โหลดตอน hover
      onTouchStart={prefetchTrip}  // รองรับ mobile
    >
      {trip.title}
    </Link>
  )
}
```

**ใช้กับ:**
- Trip cards → prefetch trip details
- Booking cards → prefetch booking details
- Seller cards → prefetch seller profile
- Tab switching → prefetch tab data

#### B. Pagination Prefetch
```typescript
// โหลด next page ล่วงหน้า
const { data } = useTrips({ page: currentPage })

useEffect(() => {
  // Prefetch next page
  queryClient.prefetchQuery({
    queryKey: tripKeys.list({ page: currentPage + 1 }),
    queryFn: fetchTrips
  })
}, [currentPage])
```

**ผลลัพธ์:** User กด next page = เห็นข้อมูลทันที!

---

### 2. **Optimistic Updates (UI ตอบสนองทันที)**
อัปเดต UI ก่อนรอ API response

#### Current: ❌ Slow
```typescript
// User กดปุ่ม → รอ loading 1-2 วินาที → เห็นผล
const handleApprove = async () => {
  setLoading(true)
  await updateStatus(id, 'approved')  // รอ API
  setLoading(false)
  refetch()  // รอ refetch อีกรอบ
}
```

#### Optimized: ✅ Instant
```typescript
// User กดปุ่ม → เห็นผลทันที → API confirm ใน background
const updateStatus = useUpdateBookingStatus()

const handleApprove = () => {
  updateStatus.mutate({ id, status: 'approved' })
  // UI update ทันที! ไม่มี loading spinner
}
```

**ใช้กับ:**
- ✅ Booking status changes
- ⏳ Seller approval/rejection
- ⏳ Trip active/inactive toggle
- ⏳ Coin redemption requests
- ⏳ Profile updates
- ⏳ Trip title/description edits

---

### 3. **Infinite Queries (Load More แทน Pagination)**
เหมาะกับ mobile & better UX

```typescript
// แทน pagination ธรรมดา
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useInfiniteBookings({ pageSize: 20 })

const allBookings = data?.pages.flatMap(page => page.bookings) || []

return (
  <>
    {allBookings.map(booking => <BookingCard key={booking.id} {...booking} />)}

    {hasNextPage && (
      <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
        {isFetchingNextPage ? 'Loading...' : 'Load More'}
      </button>
    )}
  </>
)
```

**ใช้กับ:**
- Bookings list
- Transactions history
- Notifications
- Activity logs

---

### 4. **Background Refetching (Auto-refresh data)**
Data สดใหม่โดยไม่รบกวน user

```typescript
const { data } = useBookingStats({
  refetchInterval: 30000,  // Refresh ทุก 30 วินาที
  refetchOnWindowFocus: true,  // Refresh เมื่อกลับมาที่ tab
  refetchOnReconnect: true,  // Refresh เมื่อ internet กลับมา
})
```

**ใช้กับ:**
- ✅ Coin balance (ทำแล้ว)
- ⏳ Booking stats/dashboard
- ⏳ Commission summary
- ⏳ Notifications count
- ⏳ System alerts

---

### 5. **Request Deduplication (ลด network calls)**
TanStack Query ทำให้อัตโนมัติ!

```typescript
// Component A, B, C ต่าง request trips พร้อมกัน
// Old: 3 requests → server
// New: 1 request → แชร์ให้ทั้ง 3 components
```

**Automatic benefits:**
- หลาย components ใช้ข้อมูลเดียวกัน = 1 request
- ลด server load
- ลด bandwidth usage
- เร็วขึ้นอัตโนมัติ

---

### 6. **Smart Invalidation (Refresh เฉพาะที่จำเป็น)**

```typescript
// ตัวอย่าง: เมื่อ approve booking
const updateStatus = useUpdateBookingStatus()

updateStatus.mutate(
  { id, status: 'approved' },
  {
    onSuccess: () => {
      // Invalidate เฉพาะ queries ที่เกี่ยวข้อง
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bookingKeys.stats() })
      queryClient.invalidateQueries({ queryKey: coinKeys.balance() })  // ถ้ามี coin reward

      // ไม่ invalidate trips, sellers, customers = ไม่ต้อง refetch
    }
  }
)
```

---

### 7. **Parallel Queries (โหลดพร้อมกัน)**

```typescript
// Old: โหลดทีละอย่าง (ช้า)
const trips = await fetchTrips()
const sellers = await fetchSellers()
const stats = await fetchStats()
// Total: 3-6 วินาที

// New: โหลดพร้อมกัน (เร็ว)
const { data: trips } = useTrips()
const { data: sellers } = useSellers()
const { data: stats } = useStats()
// Total: 1-2 วินาที (ของที่ช้าที่สุด)
```

**ใช้กับ:**
- Dashboard pages ที่มีหลาย sections
- Admin pages ที่ต้องโหลด multiple resources

---

### 8. **Persistent Queries (Cache ข้าม pages)**

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 10 * 60 * 1000,    // 10 minutes (formerly cacheTime)
    },
  },
})

// User: Dashboard → Trips → Dashboard
// Cache ยังอยู่! ไม่ต้องโหลดใหม่
```

**Benefits:**
- Back/forward navigation = instant
- ลด API calls มาก
- Better mobile experience

---

## 📋 Implementation Priority

### 🔴 High Priority (ทำก่อน - Impact สูง)

#### 1. **Admin Bookings Page** (60% traffic)
- ✅ Hooks ready (useBookings with optimistic updates)
- ⏳ Migrate component
- ⏳ Add prefetching on card hover
- ⏳ Add infinite scroll option

**Expected improvement:**
- 50% faster initial load
- Instant status changes
- Better mobile experience

#### 2. **Admin Dashboard/Stats** (heavy queries)
- ⏳ Create `useDashboardStats` hook
- ⏳ Auto-refresh every 30s
- ⏳ Parallel queries for all widgets

**Expected improvement:**
- 40% faster load time
- Real-time updates

#### 3. **Seller Reports Page** (complex queries)
- ⏳ Create `useSellerReports` hook
- ⏳ Add date range filters
- ⏳ Cache commission calculations

**Expected improvement:**
- 60% faster load time
- Better filter performance

### 🟡 Medium Priority

#### 4. **Admin Sellers Management**
- ⏳ Optimistic approve/reject
- ⏳ Prefetch seller details
- ⏳ Search with debouncing

#### 5. **Coins Dashboard**
- ⏳ Real-time balance updates
- ⏳ Transaction infinite scroll
- ⏳ Campaign prefetching

#### 6. **Profile Pages**
- ⏳ Optimistic profile updates
- ⏳ Image upload with progress
- ⏳ Validation before submit

### 🟢 Low Priority (Nice to have)

#### 7. **Trip Details Page**
- ⏳ Prefetch from trip cards
- ⏳ Schedule selection optimization

#### 8. **Booking Form**
- ⏳ Customer autofill from cache
- ⏳ Trip/schedule prefetch

---

## 🛠️ Implementation Plan

### Week 1: High Impact Pages
**Day 1-2: Admin Bookings**
- Migrate to TanStack Query hooks
- Add optimistic updates
- Test thoroughly

**Day 3-4: Dashboard Stats**
- Create dashboard hooks
- Add auto-refresh
- Implement parallel queries

**Day 5-7: Seller Reports**
- Create reports hooks
- Add complex filters
- Optimize calculations

### Week 2: Medium Priority
**Day 8-10: Admin Sellers & Customers**
- Create admin hooks
- Add optimistic updates
- Implement search/filters

**Day 11-14: Coins & Profile**
- Update coins pages
- Add real-time updates
- Profile optimization

---

## 📈 Performance Metrics to Track

### Before Implementation
```bash
# Run Lighthouse audit
npm run build && npm start
# Chrome DevTools > Lighthouse > Performance
```

**Current baseline (estimate):**
- Dashboard load: 2-3s
- Bookings load: 3-4s
- Trips load: 1.5-2s
- Total API calls: 150-200/session

### After Implementation (Target)
- Dashboard load: 1-1.5s ✅ (50% improvement)
- Bookings load: 1-2s ✅ (60% improvement)
- Trips load: 0.5-1s ✅ (50% improvement)
- Total API calls: 50-80/session ✅ (60% reduction)

### How to Measure
```typescript
// Add to components
import { useQueryClient } from '@tanstack/react-query'

function DebugPerformance() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const cache = queryClient.getQueryCache()
    console.log('Cached queries:', cache.getAll().length)
    console.log('Cache details:', cache.getAll())
  }, [])
}
```

---

## 🎓 Best Practices

### 1. Query Key Structure
```typescript
// Good: Hierarchical structure
const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (filters) => [...tripKeys.lists(), filters] as const,
  details: () => [...tripKeys.all, 'detail'] as const,
  detail: (id) => [...tripKeys.details(), id] as const,
}

// Bad: Flat structure
const keys = {
  trips: ['trips'],
  tripsWithFilters: ['trips', filters],  // ❌ ยาก invalidate
}
```

### 2. Error Handling
```typescript
const { data, error, isError } = useBookings()

if (isError) {
  // Show user-friendly error
  return <ErrorBoundary error={error} />
}
```

### 3. Loading States
```typescript
const { data, isLoading, isFetching } = useBookings()

// isLoading: first time loading
// isFetching: refetching/updating

return (
  <div>
    {isLoading && <FullPageLoading />}
    {isFetching && !isLoading && <RefreshingIndicator />}
    {data && <Content />}
  </div>
)
```

### 4. Stale Time Configuration
```typescript
// Short stale time: Real-time data
const { data } = useBookingStats({
  staleTime: 30000,  // 30s
})

// Long stale time: Static data
const { data } = useCountries({
  staleTime: Infinity,  // Never goes stale
})
```

---

## 🔧 DevTools Usage

```typescript
// In production, enable with localStorage
if (typeof window !== 'undefined') {
  // In browser console: localStorage.setItem('reactQueryDevtools', 'true')
  const showDevtools = localStorage.getItem('reactQueryDevtools') === 'true'

  if (showDevtools) {
    return <ReactQueryDevtools initialIsOpen={false} />
  }
}
```

**Features:**
- See all queries & their state
- Inspect cache
- Trigger refetch manually
- Monitor performance

---

## 🎯 Expected Results

### Performance Improvements
- ✅ 50-70% faster page loads
- ✅ 60% reduction in API calls
- ✅ Instant UI updates (optimistic)
- ✅ Better mobile experience
- ✅ Less server load

### Developer Experience
- ✅ Less code (~40% reduction)
- ✅ Better TypeScript support
- ✅ Easier debugging
- ✅ Less bugs (centralized logic)

### User Experience
- ✅ Faster navigation
- ✅ No loading spinners (optimistic updates)
- ✅ Real-time data
- ✅ Better offline support
- ✅ Smoother animations

---

## 📚 Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Practical React Query](https://tkdodo.eu/blog/practical-react-query)
- [Performance Best Practices](https://tanstack.com/query/latest/docs/framework/react/guides/performance)

---

## ✅ Checklist

### Phase 1: Foundation (Done)
- [x] Install TanStack Query
- [x] Setup QueryClient provider
- [x] Create base hooks structure
- [x] Document best practices

### Phase 2: Core Pages (In Progress)
- [x] Trips page with filters
- [x] Coin balance indicator
- [x] Bookings hooks with optimistic updates
- [ ] Migrate Admin Bookings component
- [ ] Add dashboard stats hooks
- [ ] Implement seller reports hooks

### Phase 3: Advanced Features (Todo)
- [ ] Add prefetching (hover, pagination)
- [ ] Add infinite scroll where needed
- [ ] Implement background refetch
- [ ] Add performance monitoring

### Phase 4: Testing & Optimization (Todo)
- [ ] Performance testing (Lighthouse)
- [ ] Load testing (multiple users)
- [ ] Mobile testing
- [ ] Documentation updates

---

## 🚀 Start Here

**Recommended order:**
1. ✅ Setup (Done)
2. ✅ Create hooks (Done)
3. **👉 Migrate Admin Bookings** ← You are here
4. Add prefetching
5. Add infinite scroll
6. Performance testing
7. Optimize based on results

Let's make this system blazing fast! 🔥
