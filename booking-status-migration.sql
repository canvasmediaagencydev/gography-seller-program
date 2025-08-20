-- Update booking status constraint และ RPC function
-- รัน SQL นี้ใน Supabase SQL Editor

-- 1. อัพเดต constraint สำหรับ booking status
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_status_check
CHECK (
  status::text = ANY (
    ARRAY[
      'pending'::character varying,
      'inprogress'::character varying,
      'approved'::character varying,
      'rejected'::character varying,
      'cancelled'::character varying
    ]::text[]
  )
);

-- 2. อัพเดต RPC function สำหรับคำนวณที่นั่งเหลือ
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

-- 3. อัพเดต RPC function สำหรับสถิติ admin dashboard (ถ้ามี)
CREATE OR REPLACE FUNCTION get_booking_stats()
RETURNS TABLE(
    total_bookings BIGINT,
    pending_bookings BIGINT,
    inprogress_bookings BIGINT,
    approved_bookings BIGINT,
    rejected_bookings BIGINT,
    cancelled_bookings BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
        COUNT(*) FILTER (WHERE status = 'inprogress') as inprogress_bookings,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_bookings,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_bookings,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings
    FROM bookings;
END;
$$ LANGUAGE plpgsql;

-- คำอธิบาย Status:
-- pending: รอดำเนินการ
-- inprogress: กำลังดำเนินการ  
-- approved: ผ่านการยืนยัน
-- rejected: แอดมินยกเลิก
-- cancelled: ลูกค้าายกเลิก
