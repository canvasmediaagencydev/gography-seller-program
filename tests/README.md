# Playwright Tests for Coin System

## ภาพรวม

ไฟล์นี้บันทึกการทดสอบระบบ Coins ด้วย Playwright MCP และ Supabase MCP

**วันที่สร้าง**: 2025-10-21
**ระบบที่ทดสอบ**: Coin & Reward System (Seller + Admin)

## เครื่องมือที่ใช้

- **Playwright MCP**: ทดสอบผ่าน browser automation
- **Supabase MCP**: จัดการ database และ seed test data
- **Local Dev Server**: `npm run dev` (http://localhost:3000)

## Test Users

### Seller Account
- **Email**: `test.seller@playwright.test`
- **Password**: `TestSeller123!@#`
- **Role**: seller
- **Status**: approved

### Admin Account
- **Email**: `test.admin@playwright.test`
- **Password**: `TestAdmin123!@#`
- **Role**: admin
- **Status**: approved

## การเตรียมก่อนทดสอบ

### 1. สร้าง Test Users
ใช้ Supabase Dashboard หรือ SQL Script:
```bash
# ดู tests/create-test-users.sql
```

หรือใช้ `tests/seed-test-data.ts`:
```bash
npx tsx tests/seed-test-data.ts
```

### 2. Start Dev Server
```bash
npm run dev
```

### 3. ตรวจสอบ Database
```sql
SELECT id, email, role, status FROM user_profiles
WHERE email LIKE '%playwright.test%';
```

## Test Scenarios

### ✅ Seller Workflows

#### 1. Login & View Coins Dashboard
- [ ] Login ด้วย seller credentials
- [ ] Navigate to `/dashboard/coins`
- [ ] Verify balance แสดงถูกต้อง
- [ ] Verify total earned แสดงถูกต้อง
- [ ] Verify total redeemed แสดงถูกต้อง

#### 2. View Transaction History
- [ ] ดู transaction table
- [ ] Pagination ทำงานถูกต้อง
- [ ] Filter by transaction type
- [ ] Filter by date range
- [ ] Transaction details แสดงครบถ้วน

#### 3. View Active Campaigns
- [ ] Active campaigns แสดงในหน้า coins
- [ ] Campaign details ครบ (title, amount, dates)
- [ ] Campaign badges แสดงบน trip cards

#### 4. Redeem Coins
- [ ] Click "Redeem Coins" button
- [ ] Modal เปิดขึ้น
- [ ] กรอกจำนวน coins
- [ ] เลือก bank account
- [ ] Submit redemption request
- [ ] Verify success message
- [ ] Verify request ถูกสร้างใน database

### ✅ Admin Workflows

#### 1. View Admin Dashboard
- [ ] Login ด้วย admin credentials
- [ ] Navigate to `/dashboard/admin/coins`
- [ ] Verify 5 tabs แสดง (Overview, Campaigns, Redemptions, Rules, Manual)
- [ ] Stats แสดงครบถ้วน

#### 2. Create Campaign
- [ ] Click Campaigns tab
- [ ] Click "Create Campaign"
- [ ] กรอก campaign details
- [ ] Select campaign type
- [ ] กำหนด coin amount
- [ ] เลือก date range
- [ ] Save campaign
- [ ] Verify campaign ปรากฏในรายการ

#### 3. Approve Redemption
- [ ] Click Redemptions tab
- [ ] ดู pending redemptions
- [ ] Click Approve button
- [ ] Verify status เปลี่ยนเป็น "approved"
- [ ] Verify coins ถูกหักจาก seller balance

#### 4. Manual Coin Adjustment
- [ ] Click Manual Adjust tab
- [ ] เลือก seller
- [ ] กรอกจำนวน coins (+/-)
- [ ] กรอกเหตุผล
- [ ] Submit adjustment
- [ ] Verify adjustment สำเร็จ
- [ ] Verify transaction log

### ✅ Integration Tests

#### 1. Coin Earning from Booking
- [ ] Admin approve booking
- [ ] Seller ได้ coins ตาม earning rules
- [ ] Campaign bonus ถูกเพิ่ม (ถ้ามี)
- [ ] Transaction log ถูก record
- [ ] Balance อัปเดตถูกต้อง

#### 2. Real-time Updates
- [ ] Open seller coins page
- [ ] Admin ทำ manual adjustment
- [ ] Verify seller page อัปเดตยอดทันที
- [ ] Event listener ทำงานถูกต้อง

## Test Results

### รอบที่ 1 - [วันที่]
- [ ] Seller Login & Dashboard
- [ ] Transaction History
- [ ] Redeem Coins
- [ ] Admin Dashboard
- [ ] Create Campaign
- [ ] Approve Redemption
- [ ] Manual Adjustment
- [ ] Integration Tests

### Issues Found
- (บันทึก bugs หรือ issues ที่พบระหว่างทดสอบ)

## Notes

- ทดสอบบน local environment เท่านั้น
- ใช้ test database แยกจาก production
- Cleanup test data หลังจากทดสอบเสร็จ
