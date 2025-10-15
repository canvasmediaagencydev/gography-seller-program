-- ==============================================
-- DATABASE INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==============================================
-- ใช้ไฟล์นี้เพื่อสร้าง indexes ใน Supabase SQL Editor
-- Copy ทั้งหมดแล้ว paste ใน SQL Editor → กด Run
-- ==============================================

-- Index สำหรับ trips filtering by active status และ country
CREATE INDEX IF NOT EXISTS idx_trips_active_country
ON trips (is_active, country_id, created_at DESC)
WHERE is_active = true;

-- Index สำหรับ trip_schedules filtering by trip และ date
CREATE INDEX IF NOT EXISTS idx_trip_schedules_trip_date
ON trip_schedules (trip_id, departure_date, is_active)
WHERE is_active = true;

-- Index สำหรับ bookings by schedule และ status
CREATE INDEX IF NOT EXISTS idx_bookings_schedule_status
ON bookings (trip_schedule_id, status, seller_id);

-- Index สำหรับ bookings by seller
CREATE INDEX IF NOT EXISTS idx_bookings_seller_status
ON bookings (seller_id, status)
WHERE status IN ('inprogress', 'approved');

-- Index สำหรับ customers referral lookup
CREATE INDEX IF NOT EXISTS idx_customers_referred_by
ON customers (referred_by_seller_id)
WHERE referred_by_seller_id IS NOT NULL;

-- Composite index สำหรับ bookings with customer referral join
CREATE INDEX IF NOT EXISTS idx_bookings_customer_status
ON bookings (customer_id, status, trip_schedule_id)
WHERE status IN ('inprogress', 'approved');

-- Index สำหรับ trip schedules by trip และ departure date
CREATE INDEX IF NOT EXISTS idx_trip_schedules_upcoming
ON trip_schedules (trip_id, departure_date, is_active)
WHERE is_active = true;

-- Index สำหรับ countries lookup
CREATE INDEX IF NOT EXISTS idx_countries_active
ON countries (id, name);

-- Partial index สำหรับ active trips with countries
CREATE INDEX IF NOT EXISTS idx_trips_with_countries
ON trips (country_id)
WHERE is_active = true AND country_id IS NOT NULL;

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_bookings_status_seller
ON bookings (status, seller_id, trip_schedule_id)
WHERE status IN ('inprogress', 'approved');

-- Index สำหรับ trip schedules ordered by departure date
CREATE INDEX IF NOT EXISTS idx_trip_schedules_departure_order
ON trip_schedules (departure_date ASC, trip_id)
WHERE is_active = true;

-- Covering index สำหรับ bookings with customer info
CREATE INDEX IF NOT EXISTS idx_bookings_customer_covering
ON bookings (customer_id, status)
INCLUDE (trip_schedule_id, seller_id);

-- ==============================================
-- ตรวจสอบว่า indexes ถูกสร้างสำเร็จแล้วด้วย query นี้:
-- ==============================================
-- SELECT schemaname, tablename, indexname
-- FROM pg_indexes
-- WHERE tablename IN ('trips', 'trip_schedules', 'bookings', 'customers')
--   AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;
