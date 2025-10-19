-- ============================================================================
-- SETUP SPECIFIC USERS WITH ROLES
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script sets up specific users with their roles:
-- - admin@garuda-21.com as admin
-- - managers@garuda-21.com as manager  
-- - user@garuda-21.com as user
-- 
-- Run this AFTER running the COMPLETE_MIGRATION_SCRIPT.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE USERS IN AUTH.USERS (if not exists)
-- ============================================================================
-- 
-- First, create these users in Supabase Auth Dashboard:
-- 
-- 1. Go to Authentication > Users
-- 2. Click "Add user" for each user:
-- 
-- User 1:
-- - Email: admin@garuda-21.com
-- - Password: AdminGaruda21!
-- - Auto Confirm User: Yes
-- 
-- User 2:
-- - Email: managers@garuda-21.com
-- - Password: ManagerGaruda21!
-- - Auto Confirm User: Yes
-- 
-- User 3:
-- - Email: user@garuda-21.com
-- - Password: UserGaruda21!
-- - Auto Confirm User: Yes
-- 
-- ============================================================================

-- ============================================================================
-- STEP 2: GET USER UUIDs
-- ============================================================================
-- 
-- After creating users, get their UUIDs:
-- 
-- 1. Go to Authentication > Users
-- 2. Find each user and copy their UUID
-- 3. Replace the UUIDs below with actual UUIDs
-- 
-- ============================================================================

-- ============================================================================
-- STEP 3: CREATE/UPDATE USER PROFILES
-- ============================================================================

-- Admin user profile
INSERT INTO user_profiles (id, email, full_name, role, is_active, created_at, updated_at)
SELECT 
    'YOUR_ADMIN_UUID_HERE', -- Replace with actual admin UUID
    'admin@garuda-21.com',
    'Admin Garuda-21',
    'admin',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE email = 'admin@garuda-21.com')
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Manager user profile
INSERT INTO user_profiles (id, email, full_name, role, is_active, created_at, updated_at)
SELECT 
    'YOUR_MANAGER_UUID_HERE', -- Replace with actual manager UUID
    'managers@garuda-21.com',
    'Manager Garuda-21',
    'manager',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE email = 'managers@garuda-21.com')
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Regular user profile
INSERT INTO user_profiles (id, email, full_name, role, is_active, created_at, updated_at)
SELECT 
    'YOUR_USER_UUID_HERE', -- Replace with actual user UUID
    'user@garuda-21.com',
    'User Garuda-21',
    'user',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE email = 'user@garuda-21.com')
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ============================================================================
-- STEP 4: CREATE PARTICIPANT RECORDS
-- ============================================================================

-- Create participant record for regular user
INSERT INTO participants (id, user_id, name, email, phone, address, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    up.id,
    up.full_name,
    up.email,
    '+6281234567890',
    'Jakarta, Indonesia',
    NOW(),
    NOW()
FROM user_profiles up
WHERE up.email = 'user@garuda-21.com'
AND NOT EXISTS (SELECT 1 FROM participants p WHERE p.user_id = up.id);

-- ============================================================================
-- STEP 5: VERIFY USER SETUP
-- ============================================================================

-- Check all users and their roles
SELECT 
    email,
    full_name,
    role,
    is_active,
    created_at
FROM user_profiles 
WHERE email IN ('admin@garuda-21.com', 'managers@garuda-21.com', 'user@garuda-21.com')
ORDER BY role, email;

-- Check participant record
SELECT 
    p.name,
    p.email,
    up.role,
    p.created_at
FROM participants p
JOIN user_profiles up ON p.user_id = up.id
WHERE up.email = 'user@garuda-21.com';

-- ============================================================================
-- STEP 6: TEST ROLE FUNCTIONS
-- ============================================================================

-- Test role checking functions (replace UUIDs with actual ones)
/*
SELECT 
    'Admin Role Check' as test_name,
    get_user_role('YOUR_ADMIN_UUID_HERE') as admin_role,
    is_admin('YOUR_ADMIN_UUID_HERE') as is_admin_check,
    is_admin_or_manager('YOUR_ADMIN_UUID_HERE') as is_admin_or_manager_check

UNION ALL

SELECT 
    'Manager Role Check',
    get_user_role('YOUR_MANAGER_UUID_HERE'),
    is_admin('YOUR_MANAGER_UUID_HERE'),
    is_admin_or_manager('YOUR_MANAGER_UUID_HERE')

UNION ALL

SELECT 
    'User Role Check',
    get_user_role('YOUR_USER_UUID_HERE'),
    is_admin('YOUR_USER_UUID_HERE'),
    is_admin_or_manager('YOUR_USER_UUID_HERE');
*/

-- ============================================================================
-- STEP 7: CREATE SAMPLE ENROLLMENTS (Optional)
-- ============================================================================

-- Create sample enrollment for user (optional)
/*
INSERT INTO enrollments (id, program_id, participant_id, status, payment_status, created_at)
SELECT 
    uuid_generate_v4(),
    p.id,
    part.id,
    'pending',
    'unpaid',
    NOW()
FROM programs p
CROSS JOIN participants part
JOIN user_profiles up ON part.user_id = up.id
WHERE up.email = 'user@garuda-21.com'
AND p.status = 'published'
LIMIT 1;
*/

-- ============================================================================
-- STEP 8: FINAL VERIFICATION
-- ============================================================================

-- Check dashboard stats for each role
SELECT 'Admin Dashboard Stats' as dashboard_type, * FROM admin_dashboard_stats
UNION ALL
SELECT 'Manager Dashboard Stats', * FROM manager_dashboard_stats
UNION ALL
SELECT 'User Dashboard Stats', * FROM user_dashboard_stats;

-- Check RLS policies are working
SELECT 
    'RLS Test' as test_type,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'manager' THEN 1 END) as manager_count,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count
FROM user_profiles;

-- ============================================================================
-- QUICK SETUP INSTRUCTIONS
-- ============================================================================
-- 
-- 1. Create users in Supabase Auth Dashboard:
--    - admin@garuda-21.com (password: AdminGaruda21!)
--    - managers@garuda-21.com (password: ManagerGaruda21!)
--    - user@garuda-21.com (password: UserGaruda21!)
-- 
-- 2. Get UUIDs from Authentication > Users
-- 
-- 3. Replace UUIDs in this script:
--    - YOUR_ADMIN_UUID_HERE
--    - YOUR_MANAGER_UUID_HERE  
--    - YOUR_USER_UUID_HERE
-- 
-- 4. Run this script
-- 
-- 5. Test login with each user
-- 
-- ============================================================================

-- ============================================================================
-- USERS SETUP COMPLETE!
-- ============================================================================
-- 
-- Your specific users are now ready:
-- ✅ admin@garuda-21.com (Admin role)
-- ✅ managers@garuda-21.com (Manager role)  
-- ✅ user@garuda-21.com (User role)
-- 
-- Next steps:
-- 1. Test login with each user
-- 2. Verify role-based access in your application
-- 3. Create additional users as needed
-- 
-- ============================================================================
