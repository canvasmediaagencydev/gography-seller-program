-- ==============================================
-- 🗄️ SUPABASE DATABASE SETUP FOR SELLER DASHBOARD
-- ==============================================
-- ⚠️  สำคัญ: รันในลำดับจากบนลงล่าง ใน Supabase SQL Editor
-- 🚀 โปรเจค: Trip Booking Platform with Role-based Access
-- 📅 สร้าง: 2025-09-01
-- ==============================================

-- ==============================================
-- 🔧 EXTENSIONS & SETUP
-- ==============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- สำหรับ performance monitoring

-- ==============================================
-- 📋 CORE TABLES
-- ==============================================

-- 🌍 Countries Table (ตารางประเทศ)
CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    flag_emoji VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 👤 User Profiles Table (ตารางข้อมูลผู้ใช้)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY, -- ต้องตรงกับ auth.users.id
    email VARCHAR(255),
    full_name VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(20) CHECK (role IN ('admin', 'seller')) DEFAULT 'seller',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    referral_code VARCHAR(20) UNIQUE,
    avatar_url TEXT,
    id_card_url TEXT,
    documents_urls TEXT[],
    commission_goal DECIMAL(10,2) DEFAULT 0,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES user_profiles(id),
    avatar_uploaded_at TIMESTAMP WITH TIME ZONE,
    id_card_uploaded_at TIMESTAMP WITH TIME ZONE,
    document_uploaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🏖️ Trips Table (ตารางแพ็คเกจทริป)
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    country_id UUID REFERENCES countries(id),
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    duration_nights INTEGER NOT NULL CHECK (duration_nights >= 0),
    price_per_person DECIMAL(10,2) NOT NULL CHECK (price_per_person > 0),
    total_seats INTEGER NOT NULL CHECK (total_seats > 0),
    commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
    commission_value DECIMAL(10,2) NOT NULL CHECK (commission_value > 0),
    cover_image_url TEXT,
    file_link TEXT, -- รอบเปลี่ยนชื่อ field_link
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📅 Trip Schedules Table (ตารางรอบเดินทาง)
CREATE TABLE trip_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,
    registration_deadline DATE NOT NULL,
    available_seats INTEGER NOT NULL CHECK (available_seats >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (return_date >= departure_date),
    CONSTRAINT valid_deadline CHECK (registration_deadline <= departure_date)
);

-- 👥 Customers Table (ตารางลูกค้า)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    id_card VARCHAR(20),
    passport_number VARCHAR(20),
    referred_by_code VARCHAR(20), -- รหัสแนะนำ
    referred_by_seller_id UUID REFERENCES user_profiles(id), -- แนะนำโดยเซลเลอร์
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🎫 Bookings Table (ตารางการจอง)
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    trip_schedule_id UUID REFERENCES trip_schedules(id),
    seller_id UUID REFERENCES user_profiles(id), -- เซลเลอร์ที่ทำการขาย
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'inprogress', 'approved', 'rejected', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
    commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    deposit_amount DECIMAL(10,2) CHECK (deposit_amount >= 0),
    remaining_amount DECIMAL(10,2) CHECK (remaining_amount >= 0),
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'partial', 'completed', 'refunded')),
    booking_date DATE DEFAULT CURRENT_DATE,
    deposit_paid_at TIMESTAMP WITH TIME ZONE,
    full_payment_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES user_profiles(id),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 💰 Commission Payments Table (ตารางการจ่ายค่าคอมมิชชั่น)
CREATE TABLE commission_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id),
    seller_id UUID REFERENCES user_profiles(id),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    percentage DECIMAL(5,2) DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('direct', 'referral')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'cancelled')),
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🎯 Sales Targets Table (ตารางเป้าหมายการขาย)
CREATE TABLE sales_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES user_profiles(id),
    target_month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    commission_target DECIMAL(10,2) NOT NULL CHECK (commission_target > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint สำหรับ seller + month
    UNIQUE(seller_id, target_month)
);

-- ==============================================
-- 🚀 PERFORMANCE INDEXES (CRITICAL!)
-- ==============================================

-- Indexes สำหรับ trips filtering
CREATE INDEX idx_trips_active_country ON trips (is_active, country_id, created_at DESC) WHERE is_active = true;
CREATE INDEX idx_trips_country_active ON trips (country_id) WHERE is_active = true AND country_id IS NOT NULL;

-- Indexes สำหรับ trip_schedules
CREATE INDEX idx_trip_schedules_trip_date ON trip_schedules (trip_id, departure_date, is_active) WHERE is_active = true;
CREATE INDEX idx_trip_schedules_upcoming ON trip_schedules (trip_id, departure_date, is_active) WHERE is_active = true;
CREATE INDEX idx_trip_schedules_departure_order ON trip_schedules (departure_date ASC, trip_id) WHERE is_active = true;

-- Indexes สำหรับ bookings
CREATE INDEX idx_bookings_schedule_status ON bookings (trip_schedule_id, status, seller_id);
CREATE INDEX idx_bookings_seller_status ON bookings (seller_id, status) WHERE status IN ('inprogress', 'approved');
CREATE INDEX idx_bookings_customer_status ON bookings (customer_id, status, trip_schedule_id) WHERE status IN ('inprogress', 'approved');
CREATE INDEX idx_bookings_status_seller ON bookings (status, seller_id, trip_schedule_id) WHERE status IN ('inprogress', 'approved');

-- Indexes สำหรับ customers
CREATE INDEX idx_customers_referred_by ON customers (referred_by_seller_id) WHERE referred_by_seller_id IS NOT NULL;
CREATE INDEX idx_customers_email ON customers (email);

-- Indexes สำหรับ user_profiles
CREATE INDEX idx_user_profiles_role ON user_profiles (role, status) WHERE role IN ('admin', 'seller');
CREATE INDEX idx_user_profiles_referral_code ON user_profiles (referral_code) WHERE referral_code IS NOT NULL;

-- Indexes สำหรับ commission_payments
CREATE INDEX idx_commission_payments_seller ON commission_payments (seller_id, status, payment_type);
CREATE INDEX idx_commission_payments_booking ON commission_payments (booking_id);

-- ==============================================
-- 📊 DATABASE VIEWS
-- ==============================================

-- View สำหรับ trips พร้อม next schedule
CREATE OR REPLACE VIEW trips_with_next_schedule AS
SELECT 
    t.*,
    c.name as country_name,
    c.flag_emoji as country_flag,
    ns.id as next_schedule_id,
    ns.departure_date as next_departure_date,
    ns.return_date as next_return_date,
    ns.available_seats as next_available_seats,
    ns.registration_deadline as next_registration_deadline
FROM trips t
LEFT JOIN countries c ON t.country_id = c.id
LEFT JOIN LATERAL (
    SELECT *
    FROM trip_schedules ts
    WHERE ts.trip_id = t.id
      AND ts.is_active = true
      AND ts.departure_date > CURRENT_DATE
    ORDER BY ts.departure_date ASC
    LIMIT 1
) ns ON true
WHERE t.is_active = true;

-- Materialized View สำหรับ seller booking statistics (เพื่อ performance)
CREATE MATERIALIZED VIEW seller_booking_stats AS
SELECT 
    COALESCE(b.seller_id, c.referred_by_seller_id) as seller_id,
    ts.trip_id,
    COUNT(*) as booking_count,
    SUM(b.total_amount) as total_amount,
    SUM(b.commission_amount) as total_commission
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
JOIN trip_schedules ts ON b.trip_schedule_id = ts.id
WHERE b.status IN ('inprogress', 'approved')
  AND (b.seller_id IS NOT NULL OR c.referred_by_seller_id IS NOT NULL)
GROUP BY COALESCE(b.seller_id, c.referred_by_seller_id), ts.trip_id;

-- Index สำหรับ materialized view (UNIQUE สำหรับ CONCURRENTLY refresh)
CREATE UNIQUE INDEX idx_seller_booking_stats_seller_trip ON seller_booking_stats (seller_id, trip_id);

-- ==============================================
-- 🔧 DATABASE FUNCTIONS
-- ==============================================

-- Function เพื่อ refresh materialized view
CREATE OR REPLACE FUNCTION refresh_seller_booking_stats()
RETURNS void AS $$
BEGIN
    -- ใช้ CONCURRENTLY หลังจากมี unique index แล้ว
    -- ครั้งแรกต้อง refresh ธรรมดาก่อน
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY seller_booking_stats;
    EXCEPTION WHEN OTHERS THEN
        -- ถ้า CONCURRENTLY ไม่ได้ ให้ refresh แบบธรรมดา
        REFRESH MATERIALIZED VIEW seller_booking_stats;
    END;
END;
$$ LANGUAGE plpgsql;

-- Function สำหรับหา available countries
CREATE OR REPLACE FUNCTION get_available_countries()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', c.id,
            'name', c.name,
            'code', c.code,
            'flag_emoji', c.flag_emoji
        )
    ) INTO result
    FROM countries c
    WHERE EXISTS (
        SELECT 1 FROM trips t 
        WHERE t.country_id = c.id 
        AND t.is_active = true
    )
    ORDER BY c.name;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- Function สำหรับหา available seats ของ schedule
CREATE OR REPLACE FUNCTION get_available_seats(schedule_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_seats INTEGER;
    booked_seats INTEGER;
BEGIN
    -- หา total seats จาก trip_schedules
    SELECT ts.available_seats INTO total_seats
    FROM trip_schedules ts
    WHERE ts.id = schedule_id;
    
    -- นับจำนวนที่จองแล้ว (status approved, inprogress, pending)
    SELECT COUNT(*) INTO booked_seats
    FROM bookings b
    WHERE b.trip_schedule_id = schedule_id
    AND b.status IN ('approved', 'inprogress', 'pending');
    
    RETURN COALESCE(total_seats, 0) - COALESCE(booked_seats, 0);
END;
$$ LANGUAGE plpgsql;

-- Function สำหรับ booking statistics
CREATE OR REPLACE FUNCTION get_booking_stats()
RETURNS TABLE (
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

-- Function สำหรับ seller list พร้อม email
CREATE OR REPLACE FUNCTION get_sellers_with_emails()
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    full_name VARCHAR,
    phone VARCHAR,
    referral_code VARCHAR,
    role VARCHAR,
    status VARCHAR,
    commission_goal DECIMAL,
    avatar_url TEXT,
    id_card_url TEXT,
    documents_urls TEXT[],
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    avatar_uploaded_at TIMESTAMP WITH TIME ZONE,
    id_card_uploaded_at TIMESTAMP WITH TIME ZONE,
    document_uploaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.email,
        up.full_name,
        up.phone,
        up.referral_code,
        up.role,
        up.status,
        up.commission_goal,
        up.avatar_url,
        up.id_card_url,
        up.documents_urls,
        up.approved_at,
        up.approved_by,
        up.avatar_uploaded_at,
        up.id_card_uploaded_at,
        up.document_uploaded_at,
        up.created_at,
        up.updated_at
    FROM user_profiles up
    WHERE up.role = 'seller'
    ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function สำหรับ trip statistics by user
CREATE OR REPLACE FUNCTION get_trip_stats(p_user_id UUID, p_user_role VARCHAR)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    IF p_user_role = 'admin' THEN
        SELECT json_build_object(
            'total_trips', COUNT(*),
            'active_trips', COUNT(*) FILTER (WHERE is_active = true),
            'total_schedules', (SELECT COUNT(*) FROM trip_schedules),
            'upcoming_schedules', (SELECT COUNT(*) FROM trip_schedules WHERE departure_date > CURRENT_DATE)
        ) INTO result
        FROM trips;
    ELSE
        -- For seller, show trips they have bookings in
        SELECT json_build_object(
            'available_trips', COUNT(DISTINCT t.id),
            'my_bookings', COALESCE(booking_stats.total_bookings, 0),
            'total_commission', COALESCE(booking_stats.total_commission, 0)
        ) INTO result
        FROM trips t
        LEFT JOIN LATERAL (
            SELECT 
                COUNT(*) as total_bookings,
                SUM(commission_amount) as total_commission
            FROM bookings b
            JOIN trip_schedules ts ON b.trip_schedule_id = ts.id
            WHERE (b.seller_id = p_user_id OR EXISTS (
                SELECT 1 FROM customers c 
                WHERE c.id = b.customer_id 
                AND c.referred_by_seller_id = p_user_id
            ))
            AND ts.trip_id = t.id
        ) booking_stats ON true
        WHERE t.is_active = true;
    END IF;
    
    RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql;

-- Function สำหรับดึงข้อมูล trips พร้อม seller data (ใช้ใน API)
CREATE OR REPLACE FUNCTION get_trips_with_seller_data(
    p_user_id UUID,
    p_user_role VARCHAR,
    p_filter VARCHAR DEFAULT 'all',
    p_countries UUID[] DEFAULT NULL,
    p_page INTEGER DEFAULT 1,
    p_page_size INTEGER DEFAULT 6
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    offset_val INTEGER;
BEGIN
    offset_val := (p_page - 1) * p_page_size;
    
    WITH filtered_trips AS (
        SELECT t.*, c.name as country_name, c.flag_emoji as country_flag
        FROM trips t
        LEFT JOIN countries c ON t.country_id = c.id
        WHERE t.is_active = true
        AND (p_countries IS NULL OR t.country_id = ANY(p_countries))
    ),
    trips_with_next_schedule AS (
        SELECT 
            ft.*,
            ns.id as next_schedule_id,
            ns.departure_date,
            ns.return_date,
            ns.available_seats,
            ns.registration_deadline
        FROM filtered_trips ft
        LEFT JOIN LATERAL (
            SELECT *
            FROM trip_schedules ts
            WHERE ts.trip_id = ft.id
            AND ts.is_active = true
            AND ts.departure_date > CURRENT_DATE
            ORDER BY ts.departure_date ASC
            LIMIT 1
        ) ns ON true
    ),
    trips_with_seller_stats AS (
        SELECT 
            twns.*,
            CASE 
                WHEN p_user_role = 'seller' THEN (
                    SELECT COUNT(*)
                    FROM bookings b
                    JOIN trip_schedules ts ON b.trip_schedule_id = ts.id
                    WHERE ts.trip_id = twns.id
                    AND (b.seller_id = p_user_id OR EXISTS (
                        SELECT 1 FROM customers c 
                        WHERE c.id = b.customer_id 
                        AND c.referred_by_seller_id = p_user_id
                    ))
                )
                ELSE 0
            END as seller_bookings_count,
            CASE 
                WHEN twns.next_schedule_id IS NOT NULL THEN
                    get_available_seats(twns.next_schedule_id)
                ELSE NULL
            END as available_seats
        FROM trips_with_next_schedule twns
    )
    SELECT json_build_object(
        'trips', json_agg(
            json_build_object(
                'id', id,
                'title', title,
                'description', description,
                'country_id', country_id,
                'duration_days', duration_days,
                'duration_nights', duration_nights,
                'price_per_person', price_per_person,
                'total_seats', total_seats,
                'commission_type', commission_type,
                'commission_value', commission_value,
                'cover_image_url', cover_image_url,
                'file_link', file_link,
                'is_active', is_active,
                'created_at', created_at,
                'updated_at', updated_at,
                'countries', CASE WHEN country_id IS NOT NULL THEN 
                    json_build_object(
                        'id', country_id,
                        'name', country_name,
                        'flag_emoji', country_flag
                    )
                    ELSE NULL 
                END,
                'next_schedule', CASE WHEN next_schedule_id IS NOT NULL THEN
                    json_build_object(
                        'id', next_schedule_id,
                        'departure_date', departure_date,
                        'return_date', return_date,
                        'available_seats', available_seats,
                        'registration_deadline', registration_deadline
                    )
                    ELSE NULL
                END,
                'seller_bookings_count', seller_bookings_count,
                'available_seats', available_seats
            )
        ),
        'pagination', json_build_object(
            'page', p_page,
            'pageSize', p_page_size,
            'total', (SELECT COUNT(*) FROM trips_with_seller_stats),
            'totalPages', CEIL((SELECT COUNT(*) FROM trips_with_seller_stats)::DECIMAL / p_page_size)
        )
    ) INTO result
    FROM (
        SELECT * FROM trips_with_seller_stats
        ORDER BY created_at DESC
        LIMIT p_page_size OFFSET offset_val
    ) paginated_trips;
    
    RETURN COALESCE(result, '{"trips": [], "pagination": {"page": 1, "pageSize": 6, "total": 0, "totalPages": 0}}'::json);
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 📂 SAMPLE DATA INSERT
-- ==============================================

-- เพิ่มข้อมูลประเทศ
INSERT INTO countries (code, name, flag_emoji) VALUES
('TH', 'Thailand', '🇹🇭'),
('JP', 'Japan', '🇯🇵'),
('KR', 'South Korea', '🇰🇷'),
('SG', 'Singapore', '🇸🇬'),
('MY', 'Malaysia', '🇲🇾'),
('VN', 'Vietnam', '🇻🇳'),
('ID', 'Indonesia', '🇮🇩'),
('PH', 'Philippines', '🇵🇭'),
('TW', 'Taiwan', '🇹🇼'),
('HK', 'Hong Kong', '🇭🇰'),
('CN', 'China', '🇨🇳'),
('IN', 'India', '🇮🇳'),
('MM', 'Myanmar', '🇲🇲'),
('KH', 'Cambodia', '🇰🇭'),
('LA', 'Laos', '🇱🇦')
ON CONFLICT (code) DO NOTHING;

-- ==============================================
-- 🔒 ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

-- Countries: อ่านได้ทุกคน
CREATE POLICY "Countries are readable by everyone" ON countries FOR SELECT USING (true);

-- User Profiles: ดูได้เฉพาะ admin และ ตัวเอง
CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON user_profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- User Profiles: สร้างได้เฉพาะ profile ตัวเอง (สำหรับ registration)
CREATE POLICY "Users can create own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON user_profiles FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Trips: อ่านได้ทุกคน (ที่ active)
CREATE POLICY "Active trips are readable by everyone" ON trips FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage all trips" ON trips FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Trip Schedules: อ่านได้ทุกคน (ที่ active)
CREATE POLICY "Active schedules are readable by everyone" ON trip_schedules FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage all schedules" ON trip_schedules FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Bookings: ดูได้เฉพาะ admin, seller ที่เกี่ยวข้อง
CREATE POLICY "Users can read related bookings" ON bookings FOR SELECT USING (
    -- Admin ดูได้หมด
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    -- Seller ดูได้เฉพาะของตัวเอง หรือ referral
    (seller_id = auth.uid() OR EXISTS (
        SELECT 1 FROM customers c 
        WHERE c.id = customer_id 
        AND c.referred_by_seller_id = auth.uid()
    ))
);

CREATE POLICY "Sellers can create bookings" ON bookings FOR INSERT WITH CHECK (
    seller_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'seller')
    )
);

-- Customers: ดูได้เฉพาะ admin, seller ที่เกี่ยวข้อง
CREATE POLICY "Users can read related customers" ON customers FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    referred_by_seller_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM bookings WHERE customer_id = customers.id AND seller_id = auth.uid())
);

-- Commission Payments: ดูได้เฉพาะ admin และ seller เจ้าของ
CREATE POLICY "Users can read own commissions" ON commission_payments FOR SELECT USING (
    seller_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Sales Targets: ดูได้เฉพาะ admin และ seller เจ้าของ
CREATE POLICY "Users can read own targets" ON sales_targets FOR SELECT USING (
    seller_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ==============================================
-- 🔄 TRIGGERS FOR UPDATED_AT
-- ==============================================

-- Function สำหรับ update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- สร้าง triggers สำหรับ tables ที่มี updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commission_payments_updated_at BEFORE UPDATE ON commission_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_targets_updated_at BEFORE UPDATE ON sales_targets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 🎯 FINAL SETUP STEPS
-- ==============================================

-- Refresh materialized view (ครั้งแรกต้อง refresh แบบธรรมดา)
REFRESH MATERIALIZED VIEW seller_booking_stats;

-- ==============================================
-- ✅ SETUP COMPLETED!
-- ==============================================
-- 
-- 🎉 Database setup เสร็จสมบูรณ์! ตอนนี้คุณสามารถ:
-- 
-- 1. ใช้ Auth ผ่าน Supabase Auth UI
-- 2. API endpoints จะทำงานได้ปกติ
-- 3. Performance ได้รับการ optimize แล้ว
-- 4. RLS policies ป้องกันข้อมูลได้
-- 
-- 📊 สำหรับตรวจสอบ performance:
-- SELECT * FROM pg_stat_statements ORDER BY mean_time DESC;
--
-- 🔄 สำหรับ refresh materialized view:
-- SELECT refresh_seller_booking_stats();
--
-- ==============================================