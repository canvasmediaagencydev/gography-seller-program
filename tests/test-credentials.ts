/**
 * Test Credentials for Playwright Tests
 *
 * ข้อมูล login credentials สำหรับ test users
 * ใช้ร่วมกับ seed-test-data.ts
 */

export const TEST_CREDENTIALS = {
  seller: {
    email: 'seller@paydee.me',
    password: 'qwer1234',
  },
  admin: {
    email: 'admin@admin',
    password: 'qwer1234',
  },
};

// Base URLs
export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Test routes
export const TEST_ROUTES = {
  // Auth
  login: '/auth/login',

  // Seller
  sellerDashboard: '/dashboard/trips',
  sellerCoins: '/dashboard/coins',
  sellerProfile: '/dashboard/profile',

  // Admin
  adminDashboard: '/dashboard/admin/sellers',
  adminCoins: '/dashboard/admin/coins',
  adminTrips: '/dashboard/admin/trips',
  adminBookings: '/dashboard/admin/bookings',
};

// Test data expectations
export const TEST_EXPECTATIONS = {
  seller: {
    initialBalance: 1000,
    totalEarned: 1500,
    totalRedeemed: 500,
    transactionCount: 4,
  },
  campaigns: {
    activeCount: 2,
  },
};
