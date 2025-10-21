-- Create Test Users for Playwright Tests
-- Run this in Supabase SQL Editor or via supabase migration

-- Note: You'll need to create auth users manually via Supabase Dashboard
-- or use the Supabase CLI with service role key

-- After creating auth users, insert their profiles here:
-- Replace UUID_SELLER and UUID_ADMIN with actual auth user IDs

-- Example for seller user:
-- INSERT INTO user_profiles (id, email, full_name, phone, role, status, referral_code)
-- VALUES (
--   'UUID_SELLER',  -- Replace with actual auth.users.id
--   'test.seller@playwright.test',
--   'Playwright Test Seller',
--   '+66812345678',
--   'seller',
--   'approved',
--   'TESTSELLER'
-- );

-- Example for admin user:
-- INSERT INTO user_profiles (id, email, full_name, phone, role, status)
-- VALUES (
--   'UUID_ADMIN',  -- Replace with actual auth.users.id
--   'test.admin@playwright.test',
--   'Playwright Test Admin',
--   '+66887654321',
--   'admin',
--   'approved'
-- );

-- Alternative: Create via function (if you have admin access)
-- You can run this SQL to create test users programmatically
