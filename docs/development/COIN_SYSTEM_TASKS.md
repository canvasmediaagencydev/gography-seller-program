# Coin System Implementation Tasks

**Project**: Gography Seller Program - Coin & Bonus System
**Start Date**: 2025-10-18
**Status**: In Progress

---

## Overview
ระบบ Coin สำหรับ Seller Program เพื่อให้รางวัลและจูงใจ seller ในการขายทริป

### Key Features:
- ✅ Coins ไม่หมดอายุ
- ✅ ได้รับ coins จาก: ขายทริปสำเร็จ, ทำยอดตามเป้า, แนะนำเพื่อน, Campaign พิเศษ
- ✅ แลก coins เป็นเงินสด
- ✅ Admin สามารถสร้าง bonus campaigns ได้

---

## Phase 1: Database Setup

### 1.1 Create Core Tables
- [x] **seller_coins** - ยอดคงเหลือของแต่ละ seller
  - `seller_id` (FK to user_profiles)
  - `balance` (decimal) - coins คงเหลือ
  - `total_earned` (decimal) - coins ที่เคยได้รับทั้งหมด
  - `total_redeemed` (decimal) - coins ที่เคยแลกไปแล้ว
  - `created_at`, `updated_at`
  - **Index**: `seller_id`
  - **Status**: ✅ Completed

- [x] **coin_transactions** - ประวัติทุกการเปลี่ยนแปลง coins
  - `id` (uuid, PK)
  - `seller_id` (FK to user_profiles)
  - `transaction_type` (enum: 'earn', 'redeem', 'bonus', 'adjustment')
  - `source_type` (enum: 'booking', 'sales_target', 'referral', 'campaign', 'admin')
  - `source_id` (uuid, nullable) - FK to booking_id, campaign_id, etc.
  - `amount` (decimal) - จำนวน coins (บวก/ลบ)
  - `balance_before` (decimal)
  - `balance_after` (decimal)
  - `description` (text)
  - `metadata` (jsonb) - ข้อมูลเพิ่มเติม
  - `created_at`
  - **Indexes**: `seller_id`, `created_at`, `source_type`, `source_id`
  - **Status**: ✅ Completed

- [x] **coin_bonus_campaigns** - Campaigns พิเศษจาก admin
  - `id` (uuid, PK)
  - `title` (text) - ชื่อแคมเปญ
  - `description` (text)
  - `campaign_type` (enum: 'trip_specific', 'date_specific', 'sales_milestone', 'general')
  - `coin_amount` (decimal) - จำนวน coins ที่ได้
  - `target_trip_id` (uuid, nullable) - FK to trips (ถ้าเฉพาะทริป)
  - `start_date` (timestamp)
  - `end_date` (timestamp)
  - `is_active` (boolean)
  - `conditions` (jsonb) - เงื่อนไขต่างๆ
  - `created_by` (FK to user_profiles - admin)
  - `created_at`, `updated_at`
  - **Indexes**: `is_active`, `start_date`, `end_date`, `target_trip_id`
  - **Status**: ✅ Completed

- [x] **coin_redemptions** - คำขอแลก coins เป็นเงิน
  - `id` (uuid, PK)
  - `seller_id` (FK to user_profiles)
  - `coin_amount` (decimal) - coins ที่ต้องการแลก
  - `cash_amount` (decimal) - เงินสดที่จะได้รับ
  - `conversion_rate` (decimal) - อัตราแลกเปลี่ยน (default: 1.0)
  - `status` (enum: 'pending', 'approved', 'rejected', 'paid')
  - `bank_account_id` (FK to bank_accounts)
  - `requested_at` (timestamp)
  - `approved_at` (timestamp, nullable)
  - `approved_by` (FK to user_profiles - admin, nullable)
  - `paid_at` (timestamp, nullable)
  - `rejection_reason` (text, nullable)
  - `notes` (text, nullable)
  - **Indexes**: `seller_id`, `status`, `requested_at`
  - **Status**: ✅ Completed

- [x] **coin_earning_rules** - กฎการได้รับ coins
  - `id` (uuid, PK)
  - `rule_name` (text) - ชื่อกฎ
  - `rule_type` (enum: 'booking_approved', 'sales_target_monthly', 'referral_first_sale', 'referral_signup')
  - `coin_amount` (decimal) - จำนวน coins
  - `calculation_type` (enum: 'fixed', 'percentage', 'tier') - คำนวณแบบคงที่หรือตามเปอร์เซ็นต์
  - `conditions` (jsonb) - เงื่อนไขเพิ่มเติม
  - `is_active` (boolean)
  - `priority` (integer) - ลำดับความสำคัญ
  - `created_at`, `updated_at`
  - **Status**: ✅ Completed

### 1.2 Database Functions & Triggers
- [x] **Function**: `add_coin_transaction()` - เพิ่ม coins และบันทึก transaction
- [x] **Function**: `calculate_sales_target_bonus()` - คำนวณ bonus จากยอดขาย
- [x] **Function**: `get_active_campaigns()` - ดึง campaigns ที่เปิดอยู่
- [x] **Trigger**: Auto-add coins เมื่อ booking approved
- [x] **Trigger**: Auto-add coins เมื่อ referral seller ทำยอดขายครั้งแรก
- [x] **Trigger**: Update seller_coins.balance เมื่อมี transaction ใหม่
- [x] **Status**: ✅ Completed

### 1.3 Row Level Security (RLS)
- [x] **seller_coins**: Seller เห็นเฉพาะของตัวเอง, Admin เห็นทั้งหมด
- [x] **coin_transactions**: Seller เห็นเฉพาะของตัวเอง, Admin เห็นทั้งหมด
- [x] **coin_redemptions**: Seller เห็นเฉพาะของตัวเอง, Admin เห็นทั้งหมด
- [x] **coin_bonus_campaigns**: Public read, Admin เท่านั้นที่ create/update
- [x] **coin_earning_rules**: Public read, Admin เท่านั้นที่ create/update
- [x] **Status**: ✅ Completed

### 1.4 Generate TypeScript Types
- [x] Run: `npx supabase gen types typescript --project-id <project-id> > database.types.ts`
- [x] **Status**: ✅ Completed

---

## Phase 2: Backend API Development

### 2.1 Seller API Routes
- [x] **GET /api/coins**
  - ดึงยอด coins คงเหลือ
  - ดึงประวัติ transactions (with pagination)
  - Filter: date range, transaction_type
  - **Status**: ✅ Completed

- [x] **POST /api/coins/redeem**
  - ส่งคำขอแลก coins เป็นเงิน
  - Validation: ตรวจสอบยอดคงเหลือ, bank account
  - **Status**: ✅ Completed

- [x] **GET /api/coins/campaigns**
  - ดึง active campaigns ที่ seller มีสิทธิ์เข้าร่วม
  - **Status**: ✅ Completed

### 2.2 Admin API Routes
- [x] **GET /api/admin/coins/stats**
  - สถิติ coins ทั้งระบบ
  - Total distributed, redeemed, pending redemptions
  - **Status**: ✅ Completed

- [x] **POST /api/admin/coins/campaigns**
  - สร้าง bonus campaign ใหม่
  - **Status**: ✅ Completed

- [x] **PATCH /api/admin/coins/campaigns/[id]**
  - แก้ไข/ปิด campaign
  - **Status**: ✅ Completed

- [x] **GET /api/admin/coins/redemptions**
  - ดูคำขอแลก coins ทั้งหมด
  - Filter: status, seller, date range
  - **Status**: ✅ Completed

- [x] **PATCH /api/admin/coins/redemptions/[id]**
  - อนุมัติ/ปฏิเสธคำขอแลก coins
  - **Status**: ✅ Completed

- [x] **POST /api/admin/coins/manual-adjustment**
  - Admin เพิ่ม/ลด coins ด้วยตนเอง
  - **Status**: ✅ Completed

- [x] **PATCH /api/admin/coins/rules/[id]**
  - แก้ไขกฎการได้ coins
  - **Status**: ✅ Completed

---

## Phase 3: Frontend Development

### 3.1 Seller Dashboard - Coins Page
- [x] **Create**: `/dashboard/coins/page.tsx`
  - **Components**:
    - Coin balance card (แสดงยอดคงเหลือ)
    - Transactions history table (with filters & pagination)
    - Active campaigns showcase
    - Redeem coins form/modal
  - **Status**: ✅ Completed

- [x] **Create**: Components in `/components/coins/`
  - `CoinBalanceCard.tsx`
  - `CoinTransactionHistory.tsx`
  - `ActiveCampaigns.tsx`
  - `RedeemCoinsModal.tsx`
  - **Status**: ✅ Completed

### 3.2 Admin Dashboard - Coin Management
- [x] **Create**: `/dashboard/admin/coins/page.tsx`
  - Tab 1: Overview & Stats
  - Tab 2: Campaigns Management
  - Tab 3: Redemption Requests
  - Tab 4: Earning Rules
  - Tab 5: Manual Adjustments
  - **Status**: ✅ Completed

- [x] **Create**: Admin Components in `/components/admin/coins/`
  - `CoinStatsOverview.tsx`
  - `CampaignManager.tsx` (with CreateCampaignModal)
  - `RedemptionRequests.tsx` (with ActionModal)
  - `EarningRulesManager.tsx` (with EditRuleModal)
  - `ManualAdjustmentForm.tsx`
  - **Status**: ✅ Completed

### 3.3 Integrate Coins Display in Existing Pages
- [x] Add coin balance indicator in main dashboard header/navbar
  - Added `CoinBalanceIndicator` component with real-time updates
  - Integrated into Sidebar (desktop) with variant="sidebar"
  - Added to MobileBottomNav as "Coins" tab
- [x] Show coin rewards in booking confirmation
  - Updated `/app/book/success/page.tsx` to display coin rewards
  - Shows different messages for referral vs direct bookings
  - Accepts query parameters: `?coins=50&referral=true`
- [x] Display campaign badges on trip cards (if applicable)
  - Created `CampaignBadge` component with animated effects
  - Auto-fetches active campaigns for each trip
  - Shows coin amount with gift icon and sparkle animation
- [x] **Status**: ✅ Completed

---

## Phase 4: Testing & Documentation

### 4.1 Testing
- [ ] Test automatic coin earning from bookings
- [ ] Test sales target bonus calculation
- [ ] Test referral coin rewards
- [ ] Test campaign coin distribution
- [ ] Test redemption workflow (request → approve → mark as paid)
- [ ] Test admin campaign creation
- [ ] Test RLS policies (seller can't see other's data)
- [ ] **Status**: ⏳ Pending

### 4.2 Documentation
- [ ] Update CLAUDE.md with coin system information
- [ ] Create COIN_SYSTEM_GUIDE.md for developers
- [ ] Document API endpoints in `/api-docs`
- [ ] **Status**: ⏳ Pending

---

## Implementation Notes

### Conversion Rate
- Default: **1 coin = 1 บาท**
- เก็บไว้ใน `coin_redemptions.conversion_rate` เพื่อความยืดหยุ่นในอนาคต

### Example Earning Rules (Initial Setup)
1. **Booking Approved**: ได้ 50 coins ต่อ 1 booking ที่ approved
2. **Sales Target (Monthly)**: บรรลุเป้าหมายรายเดือน → ได้ 1,000 coins
3. **Referral Signup**: แนะนำเพื่อนสมัครเป็น seller → ได้ 100 coins
4. **Referral First Sale**: เมื่อเพื่อนที่แนะนำขายได้ครั้งแรก → ได้ 500 coins

### Security Considerations
- ❗ ต้องใช้ Database Trigger เพื่อป้องกันการ manipulate coins ผ่าน client
- ❗ RLS policies ต้องเข้มงวด - seller ห้ามแก้ไข balance โดยตรง
- ❗ Transaction log ต้องเก็บไว้ทุกรายการ (immutable)

---

## Current Progress

**Overall Progress**: 25/25 core tasks completed (100%)**

### Phase 1: Database Setup - 8/8 completed ✅
### Phase 2: Backend API - 10/10 completed ✅
### Phase 3: Frontend - 7/7 completed ✅
  - ✅ Seller Coins Dashboard (completed)
  - ✅ Admin Coins Dashboard (completed)
  - ✅ Integration with existing pages (all 3 tasks completed)
### Phase 4: Testing & Docs - In Progress

---

## Next Steps
1. ✅ Create seller_coins table migration
2. ✅ Create coin_transactions table migration
3. ✅ Create other supporting tables
4. ✅ Implement database functions and triggers
5. ✅ Set up RLS policies
6. ✅ Create Seller API routes (GET /api/coins, POST /api/coins/redeem, GET /api/coins/campaigns)
7. ✅ Create Admin API routes
8. ✅ Create Seller Dashboard Coins Page with Components
9. ⏳ (Optional) Create Admin Dashboard Coins Management
10. ⏳ Testing and Documentation

---

**Last Updated**: 2025-10-18
**Updated By**: Claude Code
