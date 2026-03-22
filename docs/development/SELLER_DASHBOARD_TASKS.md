# Seller Dashboard Implementation Tasks

## Overview
สร้าง Dashboard สำหรับ Seller แสดงสถิติการขาย, กราฟ, ranking และรายการทริปที่ขายได้

## Status: 🚧 In Progress

---

## Tasks

### Phase 1: Setup
- [ ] Install recharts dependency
- [ ] Create TypeScript types (`/src/types/dashboard.ts`)

### Phase 2: API Routes
- [ ] `GET /api/seller/dashboard/stats` - Summary statistics
- [ ] `GET /api/seller/dashboard/monthly-sales` - Chart data
- [ ] `GET /api/seller/dashboard/ranking` - Seller ranking
- [ ] `GET /api/seller/dashboard/top-trips` - Top 3 selling trips
- [ ] `GET /api/seller/dashboard/sold-trips` - All sold trips with filters

### Phase 3: React Hooks
- [ ] Create `/src/hooks/use-seller-dashboard.ts` with TanStack Query

### Phase 4: UI Components
- [ ] `SummaryCards.tsx` - 4 stat cards (ยอดขาย, ทริป, คอมมิชชั่น, อันดับ)
- [ ] `SalesChart.tsx` - Bar chart with Recharts
- [ ] `CommissionGoalCard.tsx` - Goal progress + top 3 trips
- [ ] `SoldTripsTable.tsx` - Trips table with filters
- [ ] `EditGoalModal.tsx` - Edit commission goal

### Phase 5: Integration
- [ ] Replace `/dashboard/page.tsx` with new dashboard
- [ ] Add period filter functionality
- [ ] Loading and error states
- [ ] Responsive design

---

## File Structure

```
src/
├── types/
│   └── dashboard.ts                    # NEW
├── hooks/
│   └── use-seller-dashboard.ts         # NEW
├── app/
│   ├── dashboard/
│   │   └── page.tsx                    # MODIFY
│   └── api/
│       └── seller/
│           └── dashboard/
│               ├── stats/route.ts      # NEW
│               ├── monthly-sales/route.ts  # NEW
│               ├── ranking/route.ts    # NEW
│               ├── top-trips/route.ts  # NEW
│               └── sold-trips/route.ts # NEW
└── components/
    └── dashboard/
        ├── SummaryCards.tsx            # NEW
        ├── SalesChart.tsx              # NEW
        ├── CommissionGoalCard.tsx      # NEW
        ├── SoldTripsTable.tsx          # NEW
        └── EditGoalModal.tsx           # NEW
```

---

## Features Detail

### 1. Summary Cards
| Card | Data Source | Icon |
|------|-------------|------|
| ยอดขายรวม | SUM(bookings.total_amount) WHERE status='approved' | 💰 |
| ทริปที่ขายได้ | COUNT(DISTINCT trip_id) | ✈️ |
| คอมมิชชั่นรวม | SUM(commission_payments.amount) WHERE status='paid' | 💵 |
| อันดับ | RANK() OVER (ORDER BY total_sales DESC) | 🏆 |

### 2. Sales Chart
- Recharts BarChart
- 6 เดือนล่าสุด (default)
- Filter: 3/6/12 เดือน
- X-axis: ม.ค., ก.พ., มี.ค., ...
- Orange bars

### 3. Commission Goal
- Progress bar: current/goal
- Edit button → Modal
- Top 3 trips ที่ขายดีสุด

### 4. Sold Trips Table
| Column | Description |
|--------|-------------|
| ชื่อทริป | Image + Title |
| วันที่เดินทาง | departure - return |
| จำนวนลูกทัวร์ | Customer count dots |
| ค่าทริป(ต่อคน) | price_per_person |
| ค่าคอมมิชชั่น | Total commission |

Filter: ทั้งหมด / ชำระแล้ว / รอชำระ

---

## Database Queries

### Stats
```sql
-- Total Sales
SELECT COALESCE(SUM(total_amount), 0) as total_sales
FROM bookings
WHERE seller_id = ? AND status = 'approved';

-- Trips Sold
SELECT COUNT(DISTINCT ts.trip_id) as trips_sold
FROM bookings b
JOIN trip_schedules ts ON b.trip_schedule_id = ts.id
WHERE b.seller_id = ? AND b.status = 'approved';

-- Total Commission
SELECT COALESCE(SUM(amount), 0) as total_commission
FROM commission_payments
WHERE seller_id = ? AND status = 'paid';
```

### Ranking
```sql
WITH seller_totals AS (
  SELECT seller_id, SUM(total_amount) as total_sales
  FROM bookings WHERE status = 'approved'
  GROUP BY seller_id
),
ranked AS (
  SELECT seller_id, total_sales,
    RANK() OVER (ORDER BY total_sales DESC) as rank
  FROM seller_totals
)
SELECT rank, (SELECT COUNT(*) FROM ranked) as total_sellers
FROM ranked WHERE seller_id = ?;
```

### Monthly Sales (6 months)
```sql
SELECT
  TO_CHAR(created_at, 'YYYY-MM') as month,
  SUM(total_amount) as sales,
  SUM(commission_amount) as commission,
  COUNT(*) as booking_count
FROM bookings
WHERE seller_id = ?
  AND status = 'approved'
  AND created_at >= NOW() - INTERVAL '6 months'
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month;
```

---

## Notes
- ใช้ TanStack React Query สำหรับ data fetching
- Cache stats 60 วินาที
- Responsive: 4 cols desktop, 2 cols tablet, 1 col mobile
- Colors: primary-blue, primary-yellow (orange)
