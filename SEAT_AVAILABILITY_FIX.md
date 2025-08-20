# Real-Time Seat Availability Fix

## 🎯 ปัญหาที่แก้ไข

เมื่อ Admin อนุมัติลูกค้าแล้ว จำนวนที่นั่งเหลือใน TripCard ไม่เปลี่ยนแปลง เพราะใช้ข้อมูล static จาก `trip_schedules.available_seats`

## ✅ วิธีแก้ไข

### 1. **สร้าง Hook สำหรับ Real-Time Seats**

#### `useTripSchedules.ts`
- ดึงข้อมูล schedules พร้อมคำนวณที่นั่งจริงแบบ real-time
- ใช้ database function `get_available_seats()` 
- มี fallback calculation หากฟังก์ชัน database ล้มเหลว
- Real-time subscription สำหรับการเปลี่ยนแปลง bookings

```typescript
// ใช้ RPC function
const { data: seatsData } = await supabase
  .rpc('get_available_seats', { schedule_id: schedule.id })

// Fallback calculation
const bookedSeats = bookings?.filter(b => 
  ['approved', 'pending', 'confirmed'].includes(b.status)
).length || 0
const realTimeSeats = Math.max(0, schedule.available_seats - bookedSeats)
```

### 2. **Real-Time Subscription**
```typescript
const channel = supabase
  .channel(`trip-schedules-${tripId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public', 
    table: 'bookings'
  }, (payload) => {
    // Refetch เมื่อมีการเปลี่ยนแปลง booking
    fetchSchedulesWithSeats()
  })
  .subscribe()
```

### 3. **สร้าง SeatIndicator Component**

#### Visual Indicators:
- 🟢 **เขียว**: ที่นั่งเหลือ > 50%
- 🟡 **เหลือง**: ที่นั่งเหลือ 20-50%  
- 🔴 **แดง**: ที่นั่งเหลือ < 20%
- ⚫ **เทา**: เต็มหรือ loading

#### Features:
- Loading animation ขณะดึงข้อมูล
- Color coding ตามจำนวนที่นั่งเหลือ
- Responsive design

### 4. **ปรับปรุง TripCard**

#### Before:
```tsx
// ❌ ใช้ static value
{selectedSchedule?.available_seats || trip.total_seats} ที่นั่งเหลือ
```

#### After:
```tsx
// ✅ ใช้ real-time calculation
<SeatIndicator 
  availableSeats={getCurrentScheduleSeats()}
  totalSeats={selectedSchedule?.available_seats || trip.total_seats}
  loading={schedulesLoading}
/>
```

## 🔧 การทำงาน

### Database Function
```sql
-- ฟังก์ชันคำนวณที่นั่งจริง (อัพเดตแล้ว)
CREATE OR REPLACE FUNCTION get_available_seats(schedule_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COALESCE(ts.available_seats - COALESCE(SUM(
            CASE WHEN b.status IN ('approved', 'pending', 'inprogress') THEN 1 ELSE 0 END
        ), 0), ts.available_seats)
        FROM trip_schedules ts
        LEFT JOIN bookings b ON b.trip_schedule_id = ts.id
        WHERE ts.id = schedule_id
        GROUP BY ts.available_seats
    );
END;
$$ LANGUAGE plpgsql;
```

### Real-Time Updates
1. **Admin อนุมัติ booking** → Database trigger
2. **Booking status เปลี่ยนเป็น 'approved'** → Real-time event
3. **TripCard subscription ตรวจจับ** → Refetch data  
4. **UI อัพเดตทันที** → แสดงที่นั่งเหลือใหม่

## 🎯 ผลลัพธ์

### ✅ **ที่ได้รับ:**
- **Real-Time Updates**: ที่นั่งเหลืออัพเดตทันทีเมื่อ admin อนุมัติ
- **Visual Feedback**: สีแสดงสถานะที่นั่งเหลือ
- **Reliable Data**: มี fallback calculation หากฟังก์ชัน database ล้มเหลว
- **Performance**: ใช้ real-time subscription แทนการ polling
- **Better UX**: Loading states และ visual indicators

### 🔄 **Real-Time Flow:**
```
Admin อนุมัติ → Database Update → Real-time Event → 
TripCard Refetch → UI Update → ที่นั่งเหลือใหม่แสดง
```

## 🚀 **การใช้งาน**

```tsx
// TripCard จะอัพเดตอัตโนมัติ
<TripCard 
  trip={trip} 
  viewType="seller" 
  currentSellerId={sellerId} 
/>
```

ตอนนี้เมื่อ Admin อนุมัติลูกค้า ที่นั่งเหลือจะลดลงทันทีในหน้า seller dashboard! 🎉

## 📝 **การอัปเดตหน้า Booking**

### ✅ **TripInfoCard**
- ใช้ `useScheduleSeats` hook เพื่อดึงที่นั่งแบบ real-time
- แสดง `SeatIndicator` พร้อมสีบอกสถานะ
- อัปเดตทันทีเมื่อมีการเปลี่ยนแปลง

### ✅ **SeatAvailabilityWarning** 
- แจ้งเตือนเมื่อที่นั่งไม่เพียงพอ (แสดงเป็นสีแดง)
- แจ้งเตือนเมื่อที่นั่งใกล้เต็ม ≤ 5 ที่นั่ง (แสดงเป็นสีเหลือง)
- แสดงในหน้า booking แบบ real-time

### ✅ **useBookingActions**
- ตรวจสอบที่นั่งเหลือก่อนทำการจอง
- ใช้ `get_available_seats()` RPC function
- มี fallback calculation หากฟังก์ชัน database ล้มเหลว
- ป้องกันการจองเกินที่นั่งที่มี

## 🧪 **การทดสอบ**

### ในหน้า Seller Dashboard:
1. เปิดหน้า seller trips
2. ให้ admin อนุมัติ booking 
3. ดูที่นั่งเหลือจะลดลงทันที ✨

### ในหน้า Booking:
1. เปิดหน้าจองทริป `/book/[tripId]/[scheduleId]`
2. ดูที่นั่งเหลือแสดงแบบ real-time
3. เพิ่มผู้เดินทางจนใกล้เต็ม → จะแสดง warning
4. เพิ่มผู้เดินทางเกินที่นั่ง → จะแสดงข้อความแจ้งเตือนสีแดง
5. กดจอง → ระบบจะตรวจสอบที่นั่งก่อนยืนยัน
