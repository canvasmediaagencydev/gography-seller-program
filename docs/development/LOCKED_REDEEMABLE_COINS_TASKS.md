# Locked & Redeemable Coins + Gamification System - Implementation Tasks

## 📋 Overview
ระบบ Coins แบบใหม่ที่แบ่งเป็น **Locked Coins** (ยังถอนไม่ได้) และ **Redeemable Coins** (ถอนได้) พร้อมระบบ Gamification แบบ 2 เงื่อนไขที่ยืดหยุ่น

### Key Requirements
- ✅ Booking Approved = ทริปแรกสำเร็จ
- ✅ แต่ละ Campaign กำหนดเงื่อนไข 2 ข้อได้เอง
- ✅ เงื่อนไข 1: ทำภารกิจ (เช่น ทำแบบสอบถาม) → ได้ Locked Coins
- ✅ เงื่อนไข 2: ขายทริป 1 ทริป → Unlock Coins หรือให้โบนัส
- ✅ Existing coins จะลบทิ้ง (clean migration)

---

## Phase 1: Database Schema Migration 🗄️

### Task 1.1: สร้างตาราง gamification_campaigns
**Status**: ⬜ Not Started
**File**: Migration SQL

```sql
CREATE TABLE gamification_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,

  -- Condition 1: ภารกิจที่ต้องทำ
  condition_1_type TEXT NOT NULL, -- 'survey', 'onboarding_task', 'profile_complete', 'referral'
  condition_1_data JSONB, -- ข้อมูลเพิ่มเติม เช่น { survey_id: "xxx", task_name: "upload_photo" }
  condition_1_reward_amount DECIMAL NOT NULL,
  condition_1_reward_type TEXT NOT NULL CHECK (condition_1_reward_type IN ('locked', 'redeemable')),

  -- Condition 2: เงื่อนไขปลดล็อก
  condition_2_type TEXT NOT NULL, -- 'first_trip_sold', 'trip_count', 'sales_amount', 'none'
  condition_2_data JSONB, -- เช่น { min_trips: 1, min_amount: 5000 }
  condition_2_action TEXT NOT NULL CHECK (condition_2_action IN ('unlock', 'bonus', 'none')),
  condition_2_bonus_amount DECIMAL DEFAULT 0, -- ถ้า action = 'bonus'

  -- Metadata
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  target_audience TEXT DEFAULT 'all', -- 'all', 'new_sellers', 'specific_sellers'
  target_seller_ids UUID[] DEFAULT '{}', -- ถ้าเป็น specific_sellers

  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_bonus CHECK (
    (condition_2_action = 'bonus' AND condition_2_bonus_amount > 0) OR
    (condition_2_action != 'bonus')
  )
);

CREATE INDEX idx_gamification_campaigns_active ON gamification_campaigns(is_active, start_date, end_date);
CREATE INDEX idx_gamification_campaigns_dates ON gamification_campaigns(start_date, end_date) WHERE is_active = true;
```

**Deliverable**: Migration file created and applied

---

### Task 1.2: สร้างตาราง seller_campaign_progress
**Status**: ⬜ Not Started
**File**: Migration SQL

```sql
CREATE TABLE seller_campaign_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES gamification_campaigns(id) ON DELETE CASCADE,

  -- Condition 1 Progress
  condition_1_completed BOOLEAN DEFAULT false,
  condition_1_completed_at TIMESTAMPTZ,
  condition_1_transaction_id UUID REFERENCES coin_transactions(id),

  -- Condition 2 Progress
  condition_2_completed BOOLEAN DEFAULT false,
  condition_2_completed_at TIMESTAMPTZ,
  condition_2_transaction_id UUID REFERENCES coin_transactions(id),

  -- Overall Status
  both_completed BOOLEAN GENERATED ALWAYS AS (condition_1_completed AND condition_2_completed) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(seller_id, campaign_id)
);

CREATE INDEX idx_seller_progress_seller ON seller_campaign_progress(seller_id);
CREATE INDEX idx_seller_progress_campaign ON seller_campaign_progress(campaign_id);
CREATE INDEX idx_seller_progress_incomplete ON seller_campaign_progress(seller_id) WHERE NOT both_completed;
```

**Deliverable**: Migration file created and applied

---

### Task 1.3: อัปเดตตาราง seller_coins
**Status**: ⬜ Not Started
**File**: Migration SQL

```sql
-- Step 1: ลบข้อมูลเก่าทั้งหมด (ตามที่ user ขอ)
TRUNCATE TABLE coin_transactions CASCADE;
TRUNCATE TABLE coin_redemptions CASCADE;
TRUNCATE TABLE seller_coins CASCADE;

-- Step 2: เพิ่ม columns ใหม่
ALTER TABLE seller_coins
  ADD COLUMN locked_balance DECIMAL NOT NULL DEFAULT 0,
  ADD COLUMN redeemable_balance DECIMAL NOT NULL DEFAULT 0;

-- Step 3: ลบ column เก่า
ALTER TABLE seller_coins
  DROP COLUMN balance;

-- Step 4: อัปเดต constraints
ALTER TABLE seller_coins
  ADD CONSTRAINT positive_locked_balance CHECK (locked_balance >= 0),
  ADD CONSTRAINT positive_redeemable_balance CHECK (redeemable_balance >= 0);

-- Step 5: สร้าง index
CREATE INDEX idx_seller_coins_locked ON seller_coins(locked_balance) WHERE locked_balance > 0;
CREATE INDEX idx_seller_coins_redeemable ON seller_coins(redeemable_balance) WHERE redeemable_balance > 0;
```

**Deliverable**: seller_coins table updated with locked/redeemable balances

---

### Task 1.4: อัปเดตตาราง coin_transactions
**Status**: ⬜ Not Started
**File**: Migration SQL

```sql
-- เพิ่ม columns สำหรับ coin type
ALTER TABLE coin_transactions
  ADD COLUMN coin_type TEXT CHECK (coin_type IN ('locked', 'redeemable', 'unlock')),
  ADD COLUMN unlocked_from_transaction_id UUID REFERENCES coin_transactions(id);

-- อัปเดต enum types
ALTER TYPE coin_transaction_type ADD VALUE IF NOT EXISTS 'unlock';
ALTER TYPE coin_source_type ADD VALUE IF NOT EXISTS 'gamification';

-- สร้าง index
CREATE INDEX idx_transactions_coin_type ON coin_transactions(coin_type);
CREATE INDEX idx_transactions_unlock_ref ON coin_transactions(unlocked_from_transaction_id) WHERE unlocked_from_transaction_id IS NOT NULL;
CREATE INDEX idx_transactions_gamification ON coin_transactions(source_type, source_id) WHERE source_type = 'gamification';
```

**Deliverable**: coin_transactions table supports coin types

---

### Task 1.5: เพิ่มฟิลด์ first_trip_completed ใน user_profiles
**Status**: ⬜ Not Started
**File**: Migration SQL

```sql
ALTER TABLE user_profiles
  ADD COLUMN first_trip_completed BOOLEAN DEFAULT false,
  ADD COLUMN first_trip_completed_at TIMESTAMPTZ;

CREATE INDEX idx_user_profiles_first_trip ON user_profiles(first_trip_completed) WHERE role = 'seller';
```

**Deliverable**: user_profiles tracks first trip completion

---

## Phase 2: Database Functions & Triggers 🔧

### Task 2.1: สร้างฟังก์ชัน add_locked_or_redeemable_coins()
**Status**: ⬜ Not Started
**File**: Migration SQL

```sql
CREATE OR REPLACE FUNCTION add_locked_or_redeemable_coins(
  p_seller_id UUID,
  p_amount DECIMAL,
  p_coin_type TEXT, -- 'locked' or 'redeemable'
  p_source_type TEXT,
  p_source_id UUID,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_balance_before_locked DECIMAL;
  v_balance_before_redeemable DECIMAL;
  v_balance_after_locked DECIMAL;
  v_balance_after_redeemable DECIMAL;
BEGIN
  -- สร้าง seller_coins record ถ้ายังไม่มี
  INSERT INTO seller_coins (seller_id, locked_balance, redeemable_balance, total_earned, total_redeemed)
  VALUES (p_seller_id, 0, 0, 0, 0)
  ON CONFLICT (seller_id) DO NOTHING;

  -- ดึง balance ปัจจุบัน
  SELECT locked_balance, redeemable_balance
  INTO v_balance_before_locked, v_balance_before_redeemable
  FROM seller_coins
  WHERE seller_id = p_seller_id
  FOR UPDATE;

  -- คำนวณ balance ใหม่
  IF p_coin_type = 'locked' THEN
    v_balance_after_locked := v_balance_before_locked + p_amount;
    v_balance_after_redeemable := v_balance_before_redeemable;
  ELSIF p_coin_type = 'redeemable' THEN
    v_balance_after_locked := v_balance_before_locked;
    v_balance_after_redeemable := v_balance_before_redeemable + p_amount;
  ELSE
    RAISE EXCEPTION 'Invalid coin_type: %', p_coin_type;
  END IF;

  -- ตรวจสอบว่า balance ไม่ติดลบ
  IF v_balance_after_locked < 0 OR v_balance_after_redeemable < 0 THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- อัปเดต seller_coins
  UPDATE seller_coins
  SET
    locked_balance = v_balance_after_locked,
    redeemable_balance = v_balance_after_redeemable,
    total_earned = total_earned + GREATEST(p_amount, 0),
    updated_at = NOW()
  WHERE seller_id = p_seller_id;

  -- สร้าง transaction record
  INSERT INTO coin_transactions (
    seller_id,
    transaction_type,
    source_type,
    source_id,
    amount,
    coin_type,
    balance_before,
    balance_after,
    description,
    metadata
  ) VALUES (
    p_seller_id,
    CASE WHEN p_amount > 0 THEN 'earn' ELSE 'redeem' END,
    p_source_type,
    p_source_id,
    p_amount,
    p_coin_type,
    v_balance_before_locked + v_balance_before_redeemable,
    v_balance_after_locked + v_balance_after_redeemable,
    p_description,
    p_metadata
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Deliverable**: Function to add locked or redeemable coins

---

### Task 2.2: สร้างฟังก์ชัน unlock_coins_for_seller()
**Status**: ⬜ Not Started
**File**: Migration SQL

```sql
CREATE OR REPLACE FUNCTION unlock_coins_for_seller(
  p_seller_id UUID,
  p_campaign_id UUID DEFAULT NULL
) RETURNS TABLE(unlocked_amount DECIMAL, transaction_ids UUID[]) AS $$
DECLARE
  v_locked_amount DECIMAL;
  v_unlock_transaction_id UUID;
  v_campaign_transaction_ids UUID[] := '{}';
  v_campaign_record RECORD;
BEGIN
  -- ดึงจำนวน locked coins ปัจจุบัน
  SELECT locked_balance INTO v_locked_amount
  FROM seller_coins
  WHERE seller_id = p_seller_id
  FOR UPDATE;

  IF v_locked_amount IS NULL OR v_locked_amount <= 0 THEN
    RETURN QUERY SELECT 0::DECIMAL, '{}'::UUID[];
    RETURN;
  END IF;

  -- ถ้าระบุ campaign_id ให้ unlock เฉพาะ coins จาก campaign นั้น
  IF p_campaign_id IS NOT NULL THEN
    -- หา transaction ที่เกี่ยวข้องกับ campaign นี้
    SELECT array_agg(id)
    INTO v_campaign_transaction_ids
    FROM coin_transactions
    WHERE seller_id = p_seller_id
      AND source_type = 'gamification'
      AND source_id = p_campaign_id
      AND coin_type = 'locked';

    IF v_campaign_transaction_ids IS NULL OR array_length(v_campaign_transaction_ids, 1) = 0 THEN
      RETURN QUERY SELECT 0::DECIMAL, '{}'::UUID[];
      RETURN;
    END IF;

    -- คำนวณจำนวน coins ที่ต้อง unlock
    SELECT COALESCE(SUM(amount), 0)
    INTO v_locked_amount
    FROM coin_transactions
    WHERE id = ANY(v_campaign_transaction_ids);
  END IF;

  -- ย้าย locked → redeemable
  UPDATE seller_coins
  SET
    locked_balance = locked_balance - v_locked_amount,
    redeemable_balance = redeemable_balance + v_locked_amount,
    updated_at = NOW()
  WHERE seller_id = p_seller_id;

  -- สร้าง unlock transaction
  INSERT INTO coin_transactions (
    seller_id,
    transaction_type,
    source_type,
    source_id,
    amount,
    coin_type,
    balance_before,
    balance_after,
    description,
    metadata,
    unlocked_from_transaction_id
  )
  SELECT
    p_seller_id,
    'unlock',
    'gamification',
    p_campaign_id,
    0, -- unlock ไม่เปลี่ยน total
    'unlock',
    locked_balance + redeemable_balance - v_locked_amount,
    locked_balance + redeemable_balance,
    'Unlocked ' || v_locked_amount || ' coins',
    jsonb_build_object('unlocked_amount', v_locked_amount, 'campaign_id', p_campaign_id),
    CASE WHEN array_length(v_campaign_transaction_ids, 1) > 0 THEN v_campaign_transaction_ids[1] ELSE NULL END
  FROM seller_coins
  WHERE seller_id = p_seller_id
  RETURNING id INTO v_unlock_transaction_id;

  RETURN QUERY SELECT v_locked_amount, array_append(v_campaign_transaction_ids, v_unlock_transaction_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Deliverable**: Function to unlock coins

---

### Task 2.3: สร้าง Trigger สำหรับ Booking Approval
**Status**: ⬜ Not Started
**File**: Migration SQL

```sql
CREATE OR REPLACE FUNCTION process_booking_approval_gamification()
RETURNS TRIGGER AS $$
DECLARE
  v_campaign RECORD;
  v_progress RECORD;
  v_is_first_trip BOOLEAN;
  v_transaction_id UUID;
BEGIN
  -- ตรวจสอบว่าเป็นทริปแรกของ seller หรือไม่
  SELECT first_trip_completed INTO v_is_first_trip
  FROM user_profiles
  WHERE id = NEW.seller_id;

  -- ถ้าเป็นทริปแรก → อัปเดต user_profiles
  IF NOT v_is_first_trip THEN
    UPDATE user_profiles
    SET
      first_trip_completed = true,
      first_trip_completed_at = NOW()
    WHERE id = NEW.seller_id;

    -- Loop ผ่าน campaigns ที่ seller เข้าร่วม
    FOR v_campaign IN
      SELECT gc.*, scp.id as progress_id, scp.condition_1_completed, scp.condition_1_transaction_id
      FROM gamification_campaigns gc
      JOIN seller_campaign_progress scp ON gc.id = scp.campaign_id
      WHERE scp.seller_id = NEW.seller_id
        AND gc.is_active = true
        AND gc.condition_2_type IN ('first_trip_sold', 'trip_count')
        AND NOT scp.condition_2_completed
        AND NOW() BETWEEN gc.start_date AND gc.end_date
    LOOP
      -- เช็คว่าตรงเงื่อนไข 2 หรือไม่
      IF v_campaign.condition_2_type = 'first_trip_sold' THEN
        -- Mark condition 2 as completed
        UPDATE seller_campaign_progress
        SET
          condition_2_completed = true,
          condition_2_completed_at = NOW(),
          updated_at = NOW()
        WHERE id = v_campaign.progress_id;

        -- ถ้า condition 1 ทำเสร็จแล้ว → ดำเนินการตาม action
        IF v_campaign.condition_1_completed THEN
          IF v_campaign.condition_2_action = 'unlock' THEN
            -- Unlock coins
            PERFORM unlock_coins_for_seller(NEW.seller_id, v_campaign.id);
          ELSIF v_campaign.condition_2_action = 'bonus' AND v_campaign.condition_2_bonus_amount > 0 THEN
            -- ให้โบนัส
            v_transaction_id := add_locked_or_redeemable_coins(
              NEW.seller_id,
              v_campaign.condition_2_bonus_amount,
              'redeemable', -- โบนัสเป็น redeemable ทันที
              'gamification',
              v_campaign.id,
              'Gamification bonus: ' || v_campaign.title,
              jsonb_build_object('campaign_id', v_campaign.id, 'condition', 2)
            );

            UPDATE seller_campaign_progress
            SET condition_2_transaction_id = v_transaction_id
            WHERE id = v_campaign.progress_id;
          END IF;
        END IF;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- สร้าง trigger
DROP TRIGGER IF EXISTS trigger_gamification_on_booking_approval ON bookings;
CREATE TRIGGER trigger_gamification_on_booking_approval
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION process_booking_approval_gamification();
```

**Deliverable**: Trigger to process gamification on booking approval

---

### Task 2.4: อัปเดตฟังก์ชันเดิม (ถ้ามี)
**Status**: ⬜ Not Started
**File**: Migration SQL

```sql
-- ลบ/แก้ไขฟังก์ชันเก่าที่ใช้ balance แบบเดียว
DROP FUNCTION IF EXISTS add_coin_transaction(UUID, TEXT, TEXT, UUID, DECIMAL, TEXT, JSONB);

-- Note: ใช้ add_locked_or_redeemable_coins() แทน
```

**Deliverable**: Old functions cleaned up

---

## Phase 3: API Endpoints 🔌

### Task 3.1: อัปเดต GET /api/coins
**Status**: ⬜ Not Started
**File**: `/src/app/api/coins/route.ts`

**Changes**:
```typescript
// เปลี่ยน response structure
{
  balance: {
    locked_balance: number,
    redeemable_balance: number,
    total_balance: number, // locked + redeemable
    total_earned: number,
    total_redeemed: number
  },
  transactions: [
    {
      ...existing_fields,
      coin_type: 'locked' | 'redeemable' | 'unlock',
      unlocked_from_transaction_id: string | null
    }
  ]
}
```

**Deliverable**: Updated API returns locked/redeemable balances

---

### Task 3.2: อัปเดต POST /api/coins/redeem
**Status**: ⬜ Not Started
**File**: `/src/app/api/coins/redeem/route.ts`

**Changes**:
```typescript
// ตรวจสอบ redeemable_balance แทน balance
const { redeemable_balance } = await supabase
  .from('seller_coins')
  .select('redeemable_balance')
  .eq('seller_id', userId)
  .single();

if (coin_amount > redeemable_balance) {
  return NextResponse.json(
    { error: 'Insufficient redeemable coins' },
    { status: 400 }
  );
}
```

**Deliverable**: Redemption only allows redeemable coins

---

### Task 3.3: สร้าง GET /api/coins/gamification
**Status**: ⬜ Not Started
**File**: `/src/app/api/coins/gamification/route.ts` (NEW)

**Endpoint**: Get active campaigns and seller progress

```typescript
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ดึง active campaigns
  const { data: campaigns } = await supabase
    .from('gamification_campaigns')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', new Date().toISOString())
    .gte('end_date', new Date().toISOString());

  // ดึง progress ของ seller
  const { data: progress } = await supabase
    .from('seller_campaign_progress')
    .select('*')
    .eq('seller_id', user.id);

  return NextResponse.json({
    campaigns: campaigns || [],
    my_progress: progress || []
  });
}
```

**Deliverable**: New endpoint for gamification data

---

### Task 3.4: สร้าง POST /api/coins/gamification/complete-task
**Status**: ⬜ Not Started
**File**: `/src/app/api/coins/gamification/complete-task/route.ts` (NEW)

**Endpoint**: Mark condition 1 as completed

```typescript
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { campaign_id, task_data } = await request.json();

  // ดึงข้อมูล campaign
  const { data: campaign } = await supabase
    .from('gamification_campaigns')
    .select('*')
    .eq('id', campaign_id)
    .single();

  // Validate task completion (ตามประเภทของ condition_1_type)
  // เช่น ถ้าเป็น 'survey' ต้องตรวจสอบว่าทำแบบสอบถามเสร็จแล้ว

  // เพิ่ม locked/redeemable coins
  const { data: txId } = await adminClient.rpc('add_locked_or_redeemable_coins', {
    p_seller_id: user.id,
    p_amount: campaign.condition_1_reward_amount,
    p_coin_type: campaign.condition_1_reward_type,
    p_source_type: 'gamification',
    p_source_id: campaign_id,
    p_description: `Completed: ${campaign.title} - Condition 1`,
    p_metadata: { campaign_id, condition: 1, task_data }
  });

  // Update progress
  await adminClient
    .from('seller_campaign_progress')
    .upsert({
      seller_id: user.id,
      campaign_id,
      condition_1_completed: true,
      condition_1_completed_at: new Date().toISOString(),
      condition_1_transaction_id: txId
    });

  return NextResponse.json({ success: true, transaction_id: txId });
}
```

**Deliverable**: Endpoint to complete gamification tasks

---

### Task 3.5: สร้าง Admin Gamification APIs
**Status**: ⬜ Not Started
**Files**:
- `/src/app/api/admin/gamification/campaigns/route.ts`
- `/src/app/api/admin/gamification/campaigns/[id]/route.ts`
- `/src/app/api/admin/gamification/progress/route.ts`

**Endpoints**:
1. `POST /api/admin/gamification/campaigns` - สร้าง campaign
2. `GET /api/admin/gamification/campaigns` - ดึงรายการ campaigns
3. `PATCH /api/admin/gamification/campaigns/[id]` - แก้ไข campaign
4. `DELETE /api/admin/gamification/campaigns/[id]` - ลบ campaign
5. `GET /api/admin/gamification/progress` - ดู progress ของ sellers

**Deliverable**: Complete admin API for gamification management

---

## Phase 4: UI Components 🎨

### Task 4.1: อัปเดต CoinBalanceIndicator
**Status**: ⬜ Not Started
**File**: `/src/components/coins/CoinBalanceIndicator.tsx`

**Changes**:
```tsx
// แสดง locked และ redeemable แยกกัน
<div className="coin-balance">
  <div className="redeemable">
    <Coins className="w-4 h-4" />
    <span>{redeemableBalance.toLocaleString()}</span>
    <span className="text-xs text-muted-foreground">ถอนได้</span>
  </div>

  {lockedBalance > 0 && (
    <div className="locked">
      <Lock className="w-4 h-4" />
      <span>{lockedBalance.toLocaleString()}</span>
      <span className="text-xs text-muted-foreground">ล็อก</span>
    </div>
  )}
</div>
```

**Deliverable**: Updated component shows locked/redeemable

---

### Task 4.2: อัปเดตหน้า /dashboard/coins
**Status**: ⬜ Not Started
**File**: `/src/app/dashboard/coins/page.tsx`

**Changes**:
1. แสดง balance cards แยก locked/redeemable
2. เพิ่ม section "Gamification Challenges"
3. แสดง progress bars สำหรับแต่ละ campaign
4. Transaction history แสดง coin_type

**Deliverable**: Complete seller coins dashboard

---

### Task 4.3: อัปเดต Redemption Modal
**Status**: ⬜ Not Started
**File**: `/src/components/coins/RedeemCoinsModal.tsx`

**Changes**:
```tsx
// แสดงเฉพาะ redeemable_balance
<div className="max-redeemable">
  <p>ยอดคงเหลือที่ถอนได้: {redeemableBalance} Coins</p>
  {lockedBalance > 0 && (
    <Alert>
      <Lock className="h-4 w-4" />
      <AlertDescription>
        คุณมี {lockedBalance} Locked Coins ที่ยังถอนไม่ได้
        ทำภารกิจให้ครบเพื่อปลดล็อก
      </AlertDescription>
    </Alert>
  )}
</div>
```

**Deliverable**: Modal only allows redeemable coins redemption

---

### Task 4.4: สร้าง GamificationChallenges Component
**Status**: ⬜ Not Started
**File**: `/src/components/coins/GamificationChallenges.tsx` (NEW)

**Features**:
- แสดงรายการ active campaigns
- Progress bars สำหรับแต่ละเงื่อนไข
- ปุ่ม "Complete Task" สำหรับ condition 1
- แสดง rewards และ unlock conditions

**Deliverable**: New component for gamification UI

---

### Task 4.5: สร้างหน้า Admin Gamification
**Status**: ⬜ Not Started
**File**: `/src/app/dashboard/admin/gamification/page.tsx` (NEW)

**Features**:
1. **Tab: Campaigns**
   - ตาราง campaigns พร้อมสถานะ
   - ปุ่มสร้าง campaign ใหม่
   - แก้ไข/ลบ campaign

2. **Tab: Progress**
   - ดู progress ของ sellers
   - กรองตาม campaign
   - Export data

3. **Create/Edit Campaign Modal**
   - Form สำหรับกรอกข้อมูล campaign
   - Condition 1: ประเภทภารกิจ + รางวัล + ประเภท coins
   - Condition 2: เงื่อนไขปลดล็อก + action + โบนัส

**Deliverable**: Complete admin gamification dashboard

---

## Phase 5: Testing & Validation ✅

### Task 5.1: Database Testing
**Status**: ⬜ Not Started

**Test Cases**:
1. สร้าง campaign ใหม่
2. Seller ทำ condition 1 → ได้ locked coins
3. Seller approve booking → unlock coins
4. Seller ถอน redeemable coins → สำเร็จ
5. Seller พยายามถอน locked coins → ล้มเหลว

**Deliverable**: All database functions work correctly

---

### Task 5.2: API Testing
**Status**: ⬜ Not Started

**Test Cases**:
1. GET /api/coins → ได้ locked/redeemable ถูกต้อง
2. POST /api/coins/gamification/complete-task → เพิ่ม locked coins
3. POST /api/coins/redeem → ตรวจสอบ redeemable_balance
4. Admin APIs ทั้งหมดทำงานถูกต้อง

**Deliverable**: All APIs tested and working

---

### Task 5.3: UI/UX Testing
**Status**: ⬜ Not Started

**Test Cases**:
1. Balance indicator แสดง locked/redeemable ถูกต้อง
2. Gamification challenges แสดง progress ถูกต้อง
3. Redemption modal block locked coins
4. Admin dashboard สร้าง/แก้ไข campaign ได้
5. Real-time updates ทำงาน

**Deliverable**: UI works smoothly

---

### Task 5.4: End-to-End Scenario Testing
**Status**: ⬜ Not Started

**Scenario 1: New Seller Journey**
1. Seller สมัครใหม่
2. เห็น gamification campaign "Welcome Bonus"
3. ทำแบบสอบถาม → ได้ 500 locked coins
4. ขายทริปแรก → locked coins → redeemable
5. ถอน 500 coins → สำเร็จ

**Scenario 2: Multiple Campaigns**
1. Seller เข้าร่วม 2 campaigns พร้อมกัน
2. ทำ condition 1 ของทั้ง 2 → ได้ locked coins จาก 2 sources
3. ขายทริปแรก → unlock coins จากทั้ง 2 campaigns
4. Balance ถูกต้อง

**Deliverable**: All scenarios work end-to-end

---

## Phase 6: Documentation & Deployment 📚

### Task 6.1: อัปเดต Documentation
**Status**: ⬜ Not Started

**Files to Update**:
- `COIN_SYSTEM_GUIDE.md` - เพิ่ม locked/redeemable concepts
- `CLAUDE.md` - อัปเดต database schema info
- `README.md` (ถ้ามี) - เพิ่ม gamification features

**Deliverable**: Documentation up to date

---

### Task 6.2: Supabase RLS Policies
**Status**: ⬜ Not Started
**File**: Migration SQL

```sql
-- seller_campaign_progress policies
CREATE POLICY "Sellers view own progress" ON seller_campaign_progress
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert own progress" ON seller_campaign_progress
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- gamification_campaigns policies (public read, admin write)
CREATE POLICY "Anyone can view active campaigns" ON gamification_campaigns
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage campaigns" ON gamification_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**Deliverable**: RLS policies protect data correctly

---

### Task 6.3: Performance Optimization
**Status**: ⬜ Not Started

**Actions**:
1. เพิ่ม database indexes (already in migration)
2. API caching สำหรับ campaigns list
3. Optimize queries (ใช้ joins แทน N+1)

**Deliverable**: System performs well under load

---

### Task 6.4: Deployment
**Status**: ⬜ Not Started

**Steps**:
1. Backup production database
2. Run migration SQL (จะลบข้อมูล coins เก่า!)
3. Deploy new API code
4. Deploy new UI code
5. Verify all systems operational
6. Monitor for errors

**Deliverable**: System deployed to production

---

## Summary Checklist 📊

### Database (9 tasks) ✅ COMPLETED
- [x] 1.1 สร้างตาราง gamification_campaigns
- [x] 1.2 สร้างตาราง seller_campaign_progress
- [x] 1.3 อัปเดต seller_coins (locked/redeemable)
- [x] 1.4 อัปเดต coin_transactions (coin_type)
- [x] 1.5 เพิ่ม first_trip_completed ใน user_profiles
- [x] 2.1 สร้างฟังก์ชัน add_locked_or_redeemable_coins()
- [x] 2.2 สร้างฟังก์ชัน unlock_coins_for_seller()
- [x] 2.3 สร้าง Trigger สำหรับ Booking Approval
- [x] 2.4 อัปเดต old triggers (trigger_booking_approved_coins, trigger_referral_first_sale_coins)

### API (9 endpoints) ✅ COMPLETED
- [x] 3.1 อัปเดต GET /api/coins (returns locked_balance, redeemable_balance)
- [x] 3.2 อัปเดต POST /api/coins/redeem (validates redeemable only)
- [x] 3.3 สร้าง GET /api/coins/gamification (active campaigns + progress)
- [x] 3.4 สร้าง POST /api/coins/gamification/complete-task (mark condition 1 completed)
- [x] 3.5 สร้าง GET /api/admin/gamification/campaigns (list with stats)
- [x] 3.6 สร้าง POST /api/admin/gamification/campaigns (create campaign)
- [x] 3.7 สร้าง PATCH /api/admin/gamification/campaigns/[id] (update campaign)
- [x] 3.8 สร้าง DELETE /api/admin/gamification/campaigns/[id] (delete/deactivate)
- [x] 3.9 สร้าง GET /api/admin/gamification/progress (view seller progress)

### UI (5 tasks) - 🔄 IN PROGRESS
- [x] 4.1 อัปเดต CoinBalanceIndicator (shows total + locked indicator)
- [ ] 4.2 อัปเดตหน้า /dashboard/coins (locked/redeemable cards + gamification section)
- [ ] 4.3 อัปเดต Redemption Modal (redeemable only + locked warning)
- [ ] 4.4 สร้าง GamificationChallenges Component (campaign cards + progress)
- [ ] 4.5 สร้างหน้า Admin Gamification (campaign manager + progress viewer)

### Testing (4 tasks) - ✅ PARTIALLY COMPLETED
- [x] 5.1 Database Testing (functions & triggers tested)
- [x] 5.2 End-to-End Scenario Testing (full gamification flow verified)
- [ ] 5.3 API Testing (manual testing needed)
- [ ] 5.4 UI/UX Testing (after UI components complete)

### Deployment (4 tasks) - ⏳ PENDING
- [ ] 6.1 อัปเดต Documentation (COIN_SYSTEM_GUIDE.md, CLAUDE.md)
- [x] 6.2 RLS Policies (already created in migrations)
- [x] 6.3 Performance Optimization (indexes created, API caching implemented)
- [ ] 6.4 Production Deployment

---

## Notes & Considerations 📝

### การใช้ Supabase MCP
- ใช้ `mcp__supabase__apply_migration` สำหรับรัน SQL migrations
- ใช้ `mcp__supabase__execute_sql` สำหรับ test queries
- ใช้ `mcp__supabase__list_tables` เพื่อ verify schema changes
- ใช้ `mcp__supabase__get_advisors` เพื่อเช็ค security issues

### Breaking Changes
⚠️ **WARNING**: Migration นี้จะลบ coins ทั้งหมดในระบบ!
- Coins เก่าจะหายทั้งหมด
- Transaction history จะหายทั้งหมด
- Redemption history จะหายทั้งหมด

### Dependencies
- Supabase Database Functions support
- PostgreSQL 13+
- UUID extension enabled
- JSONB support

### Estimated Timeline
- Phase 1: 2-3 hours (Database)
- Phase 2: 2-3 hours (Functions & Triggers)
- Phase 3: 3-4 hours (APIs)
- Phase 4: 4-5 hours (UI)
- Phase 5: 2-3 hours (Testing)
- Phase 6: 1-2 hours (Deployment)

**Total: ~15-20 hours**

---

**Created**: 2025-10-28
**Last Updated**: 2025-10-28
**Status**: Ready for Implementation
