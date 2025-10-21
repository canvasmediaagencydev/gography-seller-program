# Bugs Found During Playwright Testing

## Test Date: 2025-10-21

### Bug #1: RedemptionRequests Component - Null Reference Error

**Severity**: High
**Status**: Found during testing
**Location**: `src/components/admin/coins/RedemptionRequests.tsx:145:42`

**Description**:
The Redemptions tab in Admin Coins Management crashes with a TypeError when trying to access `redemption.seller.full_name`. The `seller` object is null even though the API query includes a join.

**Error Message**:
```
TypeError: Cannot read properties of null (reading 'full_name')
```

**Steps to Reproduce**:
1. Login as admin (admin@admin / qwer1234)
2. Navigate to `/dashboard/admin/coins`
3. Click on "Redemptions" tab
4. Page crashes with error

**Expected Behavior**:
Should display redemption requests with seller information

**Actual Behavior**:
Page crashes due to null seller object

**Root Cause**:
The component assumes `redemption.seller` is always an object, but it can be `null` if the join fails or returns no data.

**Suggested Fix**:
Add null check before accessing `seller` properties:
```typescript
{redemption.seller?.full_name || redemption.seller?.email || 'Unknown Seller'}
```

**Database Verification**:
Database query confirmed that seller data exists:
- seller_id: d4698fef-5080-4130-924b-4268f2ff8c0a
- seller_name: "Seller paydee"
- seller_email: "seller@paydee.me"

The issue is likely in how the API returns the joined data or how the component handles it.

---

## Test Summary

**Tests Passed**: 6/7
**Tests Failed**: 1/7 (Admin Redemption Approval)

### Passed Tests:
1. ✅ Seller Login & View Dashboard
2. ✅ Seller Transaction History
3. ✅ Seller Redeem Coins Flow
4. ✅ Admin Login & View Dashboard
5. ✅ Admin Coins Overview
6. ✅ Redemption Request Created in Database

### Failed Tests:
1. ❌ Admin Approve Redemption (Component crash - null reference)
