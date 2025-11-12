# Gamification System Setup Guide

## Overview
The gamification system is a two-condition challenge system that rewards sellers for completing tasks and achieving milestones.

## System Architecture

### Two-Condition System
Each campaign has two conditions:

**Condition 1** (Initial Task):
- Simple task completion (survey, onboarding, profile, referral)
- Awards coins upon completion (earning or redeemable type)
- Unlocks Condition 2

**Condition 2** (Gated by Condition 1):
- More challenging tasks (first_trip_sold, trip_count, sales_amount)
- Can perform one of three actions:
  - **unlock**: Convert earning coins to redeemable coins
  - **bonus**: Add extra bonus coins
  - **none**: Just track completion

## Database Setup

### Step 1: Apply Migration

The migration SQL file has been created at:
```
supabase/migrations/20251029105839_create_gamification_tables.sql
```

**To apply the migration:**

1. **Option A: Using Supabase Dashboard (Recommended)**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy the contents of `supabase/migrations/20251029105839_create_gamification_tables.sql`
   - Paste and run the SQL

2. **Option B: Using Supabase CLI**
   ```bash
   npx supabase db push
   ```

### Step 2: Verify Tables Created

After running the migration, verify these tables exist:
- `gamification_campaigns` - Stores campaign definitions
- `gamification_progress` - Tracks seller progress

### Step 3: Update TypeScript Types

Generate new TypeScript types to include the gamification tables:

```bash
npx supabase gen types typescript --project-id vrayoiiiclajpyzeujzw > database.types.ts
```

**Note:** After generating types, you can remove the `as any` type casts from the API routes if desired.

## Database Schema Details

### gamification_campaigns Table
```sql
- id: UUID (Primary Key)
- title: TEXT
- description: TEXT (nullable)

-- Condition 1
- condition_1_type: ENUM (survey, onboarding_task, profile_complete, referral)
- condition_1_reward_amount: INTEGER
- condition_1_reward_type: ENUM (earning, redeemable)

-- Condition 2
- condition_2_type: ENUM (first_trip_sold, trip_count, sales_amount)
- condition_2_action: ENUM (unlock, bonus, none)
- condition_2_bonus_amount: INTEGER

-- Campaign Duration
- start_date: TIMESTAMPTZ
- end_date: TIMESTAMPTZ
- is_active: BOOLEAN
- created_at, updated_at, created_by
```

### gamification_progress Table
```sql
- id: UUID (Primary Key)
- campaign_id: UUID (Foreign Key)
- seller_id: UUID (Foreign Key)
- condition_1_completed: BOOLEAN
- condition_1_completed_at: TIMESTAMPTZ
- condition_2_completed: BOOLEAN
- condition_2_completed_at: TIMESTAMPTZ
- both_completed: BOOLEAN
- created_at, updated_at
```

## API Endpoints

### Seller Endpoints

#### GET /api/coins/gamification
Fetch active campaigns and seller's progress.

**Response:**
```json
{
  "campaigns": [
    {
      "id": "uuid",
      "title": "Welcome Challenge",
      "description": "Complete your profile and make your first sale!",
      "condition_1_type": "profile_complete",
      "condition_1_reward_amount": 100,
      "condition_1_reward_type": "earning",
      "condition_2_type": "first_trip_sold",
      "condition_2_action": "unlock",
      "condition_2_bonus_amount": 0,
      "start_date": "2025-01-01T00:00:00Z",
      "end_date": "2025-12-31T23:59:59Z",
      "is_active": true
    }
  ],
  "my_progress": [
    {
      "id": "uuid",
      "campaign_id": "uuid",
      "seller_id": "uuid",
      "condition_1_completed": true,
      "condition_1_completed_at": "2025-01-15T10:30:00Z",
      "condition_2_completed": false,
      "condition_2_completed_at": null,
      "both_completed": false
    }
  ]
}
```

#### POST /api/coins/gamification/complete-task
Complete Condition 1 of a campaign.

**Request:**
```json
{
  "campaign_id": "uuid",
  "task_data": {}  // Optional metadata
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "transaction_id": "uuid",
    "coins_awarded": 100,
    "reward_type": "earning",
    "condition_2_unlocked": true
  }
}
```

### Admin Endpoints

#### GET /api/admin/gamification/campaigns
Fetch all campaigns (admin only).

**Response:**
```json
{
  "campaigns": [...]
}
```

#### POST /api/admin/gamification/campaigns
Create a new campaign (admin only).

**Request:**
```json
{
  "title": "Welcome Challenge",
  "description": "Complete your profile and make your first sale!",
  "condition_1_type": "profile_complete",
  "condition_1_reward_amount": 100,
  "condition_1_reward_type": "earning",
  "condition_2_type": "first_trip_sold",
  "condition_2_action": "unlock",
  "condition_2_bonus_amount": 0,
  "start_date": "2025-01-01T00:00:00Z",
  "end_date": "2025-12-31T23:59:59Z",
  "is_active": true
}
```

**Response:**
```json
{
  "campaign": {...}
}
```

#### PUT /api/admin/gamification/campaigns/[id]
Update a campaign (admin only).

**Request:**
```json
{
  "title": "Updated Title",
  "is_active": false
  // ... any fields to update
}
```

#### DELETE /api/admin/gamification/campaigns/[id]
Delete a campaign (admin only).

## Frontend Integration

### Seller Page
The gamification challenges are displayed at:
```
/dashboard/gamification
```

**Component:**
```tsx
<GamificationChallenges />
```

Located at: `src/components/coins/GamificationChallenges.tsx`

### Features:
- 4:3 aspect ratio cards (like trip cards)
- Two-column grid layout on large screens
- Shows both conditions with status indicators
- Real-time progress tracking
- Click "Complete Now" button to complete Condition 1
- Condition 2 auto-unlocks after Condition 1 completion
- Auto-checked by database trigger when seller achieves milestones

## Database Functions

### complete_gamification_task(p_campaign_id, p_seller_id, p_task_data)
Called when a seller clicks "Complete Now" button.

**What it does:**
1. Validates campaign is active and within date range
2. Creates or updates progress record
3. Marks Condition 1 as completed
4. Awards coins using `add_coins()` function
5. Returns transaction details

### check_and_complete_condition_2(p_seller_id)
Automatically called by trigger when bookings are approved.

**What it does:**
1. Finds all campaigns where seller has completed Condition 1 but not Condition 2
2. Checks if seller meets Condition 2 requirements
3. Marks Condition 2 as completed
4. Applies action (unlock or bonus)

## Database Triggers

### after_booking_approved_check_gamification
Fires after a booking is approved.

**Purpose:**
Automatically checks and completes Condition 2 for campaigns with:
- `condition_2_type = 'first_trip_sold'`
- Future: Will support `trip_count` and `sales_amount`

## Testing the System

### 1. Create a Test Campaign (Admin)

Use the admin coins page or API to create a campaign:

```sql
INSERT INTO gamification_campaigns (
  title,
  description,
  condition_1_type,
  condition_1_reward_amount,
  condition_1_reward_type,
  condition_2_type,
  condition_2_action,
  condition_2_bonus_amount,
  start_date,
  end_date,
  created_by
) VALUES (
  'Welcome Challenge',
  'Complete your profile and make your first sale!',
  'profile_complete',
  100,
  'earning',
  'first_trip_sold',
  'unlock',
  0,
  NOW(),
  NOW() + INTERVAL '30 days',
  (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1)
);
```

### 2. Test as Seller

1. Log in as a seller
2. Go to `/dashboard/gamification`
3. See the "Welcome Challenge" card
4. Click "Complete Now" to complete Condition 1
5. Verify coins are added to balance
6. Condition 2 should now show as "Unlocked"

### 3. Test Condition 2 Auto-Completion

1. As admin, approve a booking for that seller
2. The `after_booking_approved_check_gamification` trigger fires
3. Condition 2 is automatically marked as completed
4. If action is "unlock", earning coins convert to redeemable
5. If action is "bonus", bonus coins are awarded

## Security

### Row Level Security (RLS)
All tables have RLS enabled with policies:

**gamification_campaigns:**
- Anyone can SELECT active campaigns
- Only admins can INSERT, UPDATE, DELETE

**gamification_progress:**
- Sellers can only SELECT their own progress
- System functions can INSERT/UPDATE (via SECURITY DEFINER)

### Database Functions
- All functions use `SECURITY DEFINER` to run with elevated privileges
- Proper validation and checks are performed
- Error handling returns safe error messages

## Performance Considerations

### Indexes Created
```sql
-- Fast lookup of active campaigns
CREATE INDEX idx_gamification_campaigns_active
  ON gamification_campaigns(is_active, start_date, end_date);

-- Fast lookup of active campaigns by date
CREATE INDEX idx_gamification_campaigns_dates
  ON gamification_campaigns(start_date, end_date)
  WHERE is_active = true;

-- Fast lookup of seller progress
CREATE INDEX idx_gamification_progress_seller
  ON gamification_progress(seller_id, campaign_id);

-- Fast lookup of incomplete campaigns
CREATE INDEX idx_gamification_progress_campaign
  ON gamification_progress(campaign_id)
  WHERE both_completed = false;
```

## Future Enhancements

### Planned Features:
1. **trip_count** condition type - Complete X trips
2. **sales_amount** condition type - Reach sales target
3. Admin UI for campaign management
4. Campaign analytics and reporting
5. Leaderboard system
6. Team challenges
7. Campaign categories/tags
8. Campaign templates

## Troubleshooting

### Issue: Campaigns not showing

**Check:**
1. Campaign is active (`is_active = true`)
2. Current date is between `start_date` and `end_date`
3. Seller has permission to view campaigns (RLS policy)

**Solution:**
```sql
SELECT * FROM gamification_campaigns
WHERE is_active = true
  AND NOW() BETWEEN start_date AND end_date;
```

### Issue: Condition 2 not auto-completing

**Check:**
1. Condition 1 is completed
2. Booking status is 'approved'
3. Trigger is enabled

**Solution:**
```sql
-- Manually trigger check
SELECT check_and_complete_condition_2('seller-user-id');
```

### Issue: TypeScript errors with gamification tables

**Problem:** Types not generated yet.

**Solution:**
1. Run `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > database.types.ts`
2. Or keep using `as any` type casts (already implemented)

## Support

If you encounter issues:
1. Check the migration was applied successfully
2. Verify RLS policies are correct
3. Check database logs for errors
4. Ensure triggers are enabled
5. Test database functions directly via SQL Editor

## Conclusion

The gamification system is now fully set up and ready to use!

**Next steps:**
1. Apply the database migration
2. Create test campaigns
3. Test the system end-to-end
4. (Optional) Regenerate TypeScript types
5. Start engaging your sellers with challenges!
