# Coin System Developer Guide

## Overview

The Gography Seller Program Coin System is a comprehensive reward and incentive system designed to motivate sellers and track their achievements. This guide provides technical documentation for developers working with the system.

**Last Updated**: 2025-10-18

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Frontend Components](#frontend-components)
5. [Business Logic](#business-logic)
6. [Testing Guide](#testing-guide)
7. [Security Considerations](#security-considerations)

---

## System Architecture

### Tech Stack
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **Frontend**: React 18+ with Next.js 15
- **State Management**: React Hooks + Real-time subscriptions
- **UI Components**: shadcn/ui + Tailwind CSS

### Core Concepts

1. **Coins**: Virtual currency that sellers earn through various activities
2. **Transactions**: Immutable log of all coin movements
3. **Campaigns**: Time-limited bonus opportunities created by admins
4. **Redemptions**: Process for converting coins to cash
5. **Earning Rules**: Configurable rules for how coins are earned

---

## Database Schema

### Core Tables

#### `seller_coins`
Stores the current coin balance for each seller.

```sql
CREATE TABLE seller_coins (
  seller_id UUID PRIMARY KEY REFERENCES user_profiles(id),
  balance DECIMAL NOT NULL DEFAULT 0,
  total_earned DECIMAL NOT NULL DEFAULT 0,
  total_redeemed DECIMAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `coin_transactions`
Immutable log of all coin changes.

```sql
CREATE TABLE coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES user_profiles(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'bonus', 'adjustment')),
  source_type TEXT NOT NULL CHECK (source_type IN ('booking', 'sales_target', 'referral', 'campaign', 'admin')),
  source_id UUID,
  amount DECIMAL NOT NULL,
  balance_before DECIMAL NOT NULL,
  balance_after DECIMAL NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `coin_bonus_campaigns`
Admin-created bonus campaigns.

```sql
CREATE TABLE coin_bonus_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL,
  coin_amount DECIMAL NOT NULL,
  target_trip_id UUID REFERENCES trips(id),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  conditions JSONB,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `coin_redemptions`
Tracks requests to convert coins to cash.

```sql
CREATE TABLE coin_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES user_profiles(id),
  coin_amount DECIMAL NOT NULL,
  cash_amount DECIMAL NOT NULL,
  conversion_rate DECIMAL NOT NULL DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'pending',
  bank_account_id UUID REFERENCES bank_accounts(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES user_profiles(id),
  paid_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT
);
```

#### `coin_earning_rules`
Configurable rules for earning coins.

```sql
CREATE TABLE coin_earning_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  coin_amount DECIMAL NOT NULL,
  calculation_type TEXT NOT NULL DEFAULT 'fixed',
  conditions JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Database Triggers

#### Auto-add coins on booking approval
```sql
CREATE TRIGGER trigger_add_coins_on_booking_approval
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION add_coins_for_approved_booking();
```

---

## API Endpoints

### Seller Endpoints

#### `GET /api/coins`
Fetches seller's coin balance and transaction history.

**Query Parameters**:
- `page` (number): Page number for pagination
- `pageSize` (number): Items per page (default: 20)
- `transaction_type` (string): Filter by type ('earn', 'redeem', 'bonus', 'adjustment')
- `start_date` (ISO string): Filter from date
- `end_date` (ISO string): Filter to date

**Response**:
```json
{
  "balance": {
    "seller_id": "uuid",
    "balance": 1250,
    "total_earned": 2500,
    "total_redeemed": 1250
  },
  "transactions": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "total": 100
  }
}
```

#### `POST /api/coins/redeem`
Creates a redemption request.

**Request Body**:
```json
{
  "coin_amount": 1000,
  "bank_account_id": "uuid"
}
```

**Response**:
```json
{
  "redemption_id": "uuid",
  "status": "pending",
  "cash_amount": 1000
}
```

#### `GET /api/coins/campaigns`
Fetches active campaigns.

**Response**:
```json
{
  "campaigns": [
    {
      "id": "uuid",
      "title": "Holiday Bonus",
      "coin_amount": 100,
      "start_date": "...",
      "end_date": "..."
    }
  ]
}
```

### Admin Endpoints

#### `GET /api/admin/coins/stats`
System-wide coin statistics.

**Response**:
```json
{
  "total_distributed": 50000,
  "total_redeemed": 15000,
  "active_balance": 35000,
  "pending_redemptions": 5000
}
```

#### `POST /api/admin/coins/campaigns`
Creates a new bonus campaign.

**Request Body**:
```json
{
  "title": "Summer Sale Bonus",
  "description": "Extra coins for summer trips",
  "campaign_type": "trip_specific",
  "coin_amount": 200,
  "target_trip_id": "uuid",
  "start_date": "2025-06-01",
  "end_date": "2025-08-31"
}
```

#### `PATCH /api/admin/coins/redemptions/[id]`
Updates a redemption request status.

**Request Body**:
```json
{
  "status": "approved",
  "notes": "Approved and processed"
}
```

#### `POST /api/admin/coins/manual-adjustment`
Manually adjust a seller's coins.

**Request Body**:
```json
{
  "seller_id": "uuid",
  "amount": 500,
  "description": "Bonus for excellent performance",
  "reason": "Q1 top performer award"
}
```

---

## Frontend Components

### Shared Components

#### `CoinBalanceIndicator`
Displays seller's coin balance with real-time updates.

**Location**: `/src/components/coins/CoinBalanceIndicator.tsx`

**Usage**:
```tsx
<CoinBalanceIndicator
  userId={sellerId}
  variant="sidebar" // or "mobile" or "header"
  showLabel={true}
/>
```

**Variants**:
- `sidebar`: Large display for desktop sidebar
- `mobile`: Compact display for mobile navigation
- `header`: Minimal display for headers

#### `CampaignBadge`
Shows active campaign bonus on trip cards.

**Location**: `/src/components/trips/CampaignBadge.tsx`

**Usage**:
```tsx
<CampaignBadge tripId={trip.id} />
```

### Seller Components

Located in `/src/components/coins/`:

1. **CoinBalanceCard**: Overview card showing balance, earned, and redeemed
2. **CoinTransactionHistory**: Paginated transaction list with filters
3. **ActiveCampaigns**: Grid of active bonus campaigns
4. **RedeemCoinsModal**: Modal form for creating redemption requests

### Admin Components

Located in `/src/components/admin/coins/`:

1. **CoinStatsOverview**: System-wide statistics dashboard
2. **CampaignManager**: CRUD interface for bonus campaigns
3. **RedemptionRequests**: List and approval interface for redemptions
4. **EarningRulesManager**: Configure coin earning rules
5. **ManualAdjustmentForm**: Manually adjust seller coins

---

## Business Logic

### Coin Earning Flow

1. **Booking Approved**:
   - Trigger fires on booking status = 'approved'
   - Checks active earning rules
   - Creates transaction with source_type='booking'
   - Updates seller_coins balance

2. **Campaign Bonus**:
   - Checked when booking matches campaign criteria
   - Additional transaction created with source_type='campaign'
   - References campaign_id in source_id

3. **Referral Bonus**:
   - Triggered when referred seller makes first sale
   - Creates transactions for both seller and referrer
   - Uses source_type='referral'

### Redemption Workflow

1. **Seller Request**: Seller submits redemption via `/api/coins/redeem`
2. **Admin Review**: Admin views request in admin panel
3. **Approval**: Admin approves/rejects with optional notes
4. **Payment**: Admin marks as 'paid' after bank transfer
5. **Coin Deduction**: Coins deducted automatically on approval

### Real-time Updates

Components use event listeners for real-time updates:

```typescript
// Trigger coin balance update
window.dispatchEvent(new Event('coinBalanceUpdated'))

// Listen for updates
window.addEventListener('coinBalanceUpdated', () => {
  // Refresh balance
})
```

---

## Testing Guide

### Manual Testing Checklist

#### Coin Earning
- [ ] Create a booking and approve it
- [ ] Verify coins added to seller balance
- [ ] Check transaction appears in history
- [ ] Verify correct coin amount based on rules

#### Campaigns
- [ ] Admin creates a new campaign
- [ ] Verify campaign appears on trip cards
- [ ] Complete booking during campaign period
- [ ] Verify bonus coins added

#### Redemption
- [ ] Seller requests redemption
- [ ] Admin approves redemption
- [ ] Verify coins deducted from balance
- [ ] Admin marks as paid
- [ ] Verify status updates

#### RLS Policies
- [ ] Seller A cannot see Seller B's transactions
- [ ] Seller cannot manually update balance
- [ ] Admin can view all data
- [ ] Public can view active campaigns

### Database Testing

```sql
-- Test coin transaction
SELECT * FROM add_coin_transaction(
  'seller_uuid',
  'earn',
  'booking',
  'booking_uuid',
  100,
  'Test transaction'
);

-- Verify balance updated
SELECT balance FROM seller_coins WHERE seller_id = 'seller_uuid';

-- Check transaction log
SELECT * FROM coin_transactions WHERE seller_id = 'seller_uuid' ORDER BY created_at DESC LIMIT 1;
```

---

## Security Considerations

### Critical Security Rules

1. **Never trust client-side coin values**
   - All coin calculations happen server-side or in database triggers
   - Client can only display, not modify

2. **Immutable transaction log**
   - coin_transactions table has no UPDATE/DELETE permissions
   - Provides complete audit trail

3. **RLS Policies**
   - Sellers can only SELECT their own data
   - Only admin can INSERT/UPDATE coin_earning_rules
   - Only admin can approve redemptions

4. **Validation**
   - Redemption amount cannot exceed balance
   - Negative amounts not allowed
   - Bank account must belong to seller

### Row Level Security Examples

```sql
-- Seller can only view own coins
CREATE POLICY "Sellers view own coins" ON seller_coins
  FOR SELECT USING (auth.uid() = seller_id);

-- Seller cannot modify balance
CREATE POLICY "No direct balance updates" ON seller_coins
  FOR UPDATE USING (false);

-- Only admin can approve redemptions
CREATE POLICY "Admin approve redemptions" ON coin_redemptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## Common Issues & Solutions

### Issue: Coins not auto-added on booking approval
**Solution**: Check trigger is active and booking has seller_id

```sql
-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_add_coins_on_booking_approval';

-- Check booking has seller_id
SELECT id, seller_id, status FROM bookings WHERE id = 'booking_uuid';
```

### Issue: Redemption failing
**Solution**: Verify sufficient balance and valid bank account

```sql
-- Check balance
SELECT balance FROM seller_coins WHERE seller_id = 'seller_uuid';

-- Verify bank account
SELECT * FROM bank_accounts WHERE id = 'bank_uuid' AND seller_id = 'seller_uuid';
```

### Issue: Campaign not showing on trip
**Solution**: Check campaign dates and target_trip_id

```sql
-- View active campaigns
SELECT * FROM coin_bonus_campaigns
WHERE is_active = true
  AND start_date <= NOW()
  AND end_date >= NOW();
```

---

## Future Enhancements

### Planned Features
1. **Tier System**: Bronze, Silver, Gold tiers with multipliers
2. **Leaderboards**: Monthly top earners
3. **Coin Expiry**: Optional expiration dates for campaigns
4. **Batch Operations**: Bulk coin adjustments
5. **Analytics Dashboard**: Detailed coin flow analytics
6. **Automated Payouts**: Integration with payment gateway

### Extension Points

The system is designed to be extensible:

- **New Earning Rules**: Add entries to `coin_earning_rules`
- **Custom Calculations**: Modify `calculation_type` in rules
- **New Campaign Types**: Extend `campaign_type` enum
- **Integration Points**: Use metadata JSONB field for custom data

---

## Contact & Support

For questions or issues:
- Check existing issues in project repository
- Review COIN_SYSTEM_TASKS.md for implementation details
- Consult CLAUDE.md for general project setup

---

**Version**: 1.0
**Last Updated**: 2025-10-18
**Maintained By**: Development Team
