/**
 * Database Seeding Script for Playwright Tests
 *
 * สคริปต์นี้ใช้สำหรับสร้าง test data ในฐานข้อมูลก่อนรัน Playwright tests
 *
 * Usage:
 * ```bash
 * npx tsx tests/seed-test-data.ts
 * ```
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test user credentials
export const TEST_USERS = {
  seller: {
    email: 'test.seller@playwright.test',
    password: 'TestSeller123!@#',
    role: 'seller' as const,
    full_name: 'Playwright Test Seller',
    phone_number: '+66812345678'
  },
  admin: {
    email: 'test.admin@playwright.test',
    password: 'TestAdmin123!@#',
    role: 'admin' as const,
    full_name: 'Playwright Test Admin',
    phone_number: '+66887654321'
  }
};

async function seedTestData() {
  console.log('🌱 Starting database seeding for Playwright tests...\n');

  try {
    // 1. Clean up existing test data
    await cleanupTestData();

    // 2. Create test users
    const { sellerProfile, adminProfile } = await createTestUsers();

    // 3. Create test trips
    const trips = await createTestTrips(sellerProfile.id);

    // 4. Create coin balance for seller
    await createCoinBalance(sellerProfile.id);

    // 5. Create test campaigns
    await createTestCampaigns(trips[0].id);

    // 6. Create some initial transactions
    await createInitialTransactions(sellerProfile.id);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Seller:', TEST_USERS.seller.email, '/', TEST_USERS.seller.password);
    console.log('Admin:', TEST_USERS.admin.email, '/', TEST_USERS.admin.password);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up existing test data...');

  // Get test user IDs
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const testUserEmails = [TEST_USERS.seller.email, TEST_USERS.admin.email];
  const testUserIds = existingUsers?.users
    .filter(u => testUserEmails.includes(u.email || ''))
    .map(u => u.id) || [];

  if (testUserIds.length > 0) {
    // Delete related data
    await supabase.from('coin_redemptions').delete().in('seller_id', testUserIds);
    await supabase.from('coin_transactions').delete().in('seller_id', testUserIds);
    await supabase.from('seller_coins').delete().in('seller_id', testUserIds);
    await supabase.from('coin_bonus_campaigns').delete().in('created_by', testUserIds);
    await supabase.from('trips').delete().in('seller_id', testUserIds);
    await supabase.from('profiles').delete().in('id', testUserIds);

    // Delete auth users
    for (const userId of testUserIds) {
      await supabase.auth.admin.deleteUser(userId);
    }
  }

  console.log('✓ Cleanup completed\n');
}

async function createTestUsers() {
  console.log('👥 Creating test users...');

  // Create seller user
  const { data: sellerAuth, error: sellerAuthError } = await supabase.auth.admin.createUser({
    email: TEST_USERS.seller.email,
    password: TEST_USERS.seller.password,
    email_confirm: true,
    user_metadata: {
      full_name: TEST_USERS.seller.full_name
    }
  });

  if (sellerAuthError) throw sellerAuthError;

  // Create seller profile
  const { data: sellerProfile, error: sellerProfileError } = await supabase
    .from('profiles')
    .insert({
      id: sellerAuth.user.id,
      email: TEST_USERS.seller.email,
      full_name: TEST_USERS.seller.full_name,
      phone_number: TEST_USERS.seller.phone_number,
      role: 'seller',
      status: 'approved'
    })
    .select()
    .single();

  if (sellerProfileError) throw sellerProfileError;

  // Create admin user
  const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
    email: TEST_USERS.admin.email,
    password: TEST_USERS.admin.password,
    email_confirm: true,
    user_metadata: {
      full_name: TEST_USERS.admin.full_name
    }
  });

  if (adminAuthError) throw adminAuthError;

  // Create admin profile
  const { data: adminProfile, error: adminProfileError } = await supabase
    .from('profiles')
    .insert({
      id: adminAuth.user.id,
      email: TEST_USERS.admin.email,
      full_name: TEST_USERS.admin.full_name,
      phone_number: TEST_USERS.admin.phone_number,
      role: 'admin',
      status: 'approved'
    })
    .select()
    .single();

  if (adminProfileError) throw adminProfileError;

  console.log('✓ Created seller:', sellerProfile.email);
  console.log('✓ Created admin:', adminProfile.email);

  return { sellerProfile, adminProfile };
}

async function createTestTrips(sellerId: string) {
  console.log('\n🗺️  Creating test trips...');

  const trips = [
    {
      seller_id: sellerId,
      title: 'Test Trip: Bangkok City Tour',
      description: 'A wonderful city tour for testing',
      destination: 'Bangkok, Thailand',
      duration_days: 1,
      max_participants: 10,
      status: 'active',
      images: ['https://placehold.co/600x400/orange/white?text=Bangkok']
    },
    {
      seller_id: sellerId,
      title: 'Test Trip: Chiang Mai Adventure',
      description: 'Mountain adventure for testing',
      destination: 'Chiang Mai, Thailand',
      duration_days: 3,
      max_participants: 8,
      status: 'active',
      images: ['https://placehold.co/600x400/green/white?text=ChiangMai']
    }
  ];

  const { data, error } = await supabase
    .from('trips')
    .insert(trips)
    .select();

  if (error) throw error;

  console.log('✓ Created', data.length, 'test trips');

  return data;
}

async function createCoinBalance(sellerId: string) {
  console.log('\n💰 Creating coin balance...');

  const { data, error } = await supabase
    .from('seller_coins')
    .insert({
      seller_id: sellerId,
      balance: 1000,
      total_earned: 1500,
      total_redeemed: 500
    })
    .select()
    .single();

  if (error) throw error;

  console.log('✓ Created coin balance:', data.balance, 'coins');

  return data;
}

async function createTestCampaigns(tripId: string) {
  console.log('\n🎯 Creating test campaigns...');

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const campaigns = [
    {
      title: 'Test Campaign: Summer Bonus',
      description: 'Get 50 extra coins for bookings',
      campaign_type: 'date_specific',
      coin_amount: 50,
      start_date: now.toISOString(),
      end_date: nextMonth.toISOString(),
      is_active: true
    },
    {
      title: 'Test Campaign: Bangkok Special',
      description: 'Trip-specific bonus for Bangkok tours',
      campaign_type: 'trip_specific',
      coin_amount: 100,
      target_trip_id: tripId,
      start_date: now.toISOString(),
      end_date: nextMonth.toISOString(),
      is_active: true
    }
  ];

  const { data, error } = await supabase
    .from('coin_bonus_campaigns')
    .insert(campaigns)
    .select();

  if (error) throw error;

  console.log('✓ Created', data.length, 'test campaigns');

  return data;
}

async function createInitialTransactions(sellerId: string) {
  console.log('\n📊 Creating initial transactions...');

  const transactions = [
    {
      seller_id: sellerId,
      transaction_type: 'earn',
      source_type: 'booking',
      amount: 500,
      balance_before: 0,
      balance_after: 500,
      description: 'Earned from booking #TEST001'
    },
    {
      seller_id: sellerId,
      transaction_type: 'bonus',
      source_type: 'campaign',
      amount: 100,
      balance_before: 500,
      balance_after: 600,
      description: 'Campaign bonus: Summer Special'
    },
    {
      seller_id: sellerId,
      transaction_type: 'earn',
      source_type: 'booking',
      amount: 400,
      balance_before: 600,
      balance_after: 1000,
      description: 'Earned from booking #TEST002'
    },
    {
      seller_id: sellerId,
      transaction_type: 'redeem',
      source_type: 'admin',
      amount: -500,
      balance_before: 1500,
      balance_after: 1000,
      description: 'Redeemed 500 coins to cash'
    }
  ];

  const { data, error } = await supabase
    .from('coin_transactions')
    .insert(transactions)
    .select();

  if (error) throw error;

  console.log('✓ Created', data.length, 'test transactions');

  return data;
}

// Cleanup function for after tests
export async function cleanupAfterTests() {
  console.log('\n🧹 Cleaning up after tests...');
  await cleanupTestData();
  console.log('✓ Cleanup completed');
}

// Run seeding if executed directly
if (require.main === module) {
  seedTestData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
