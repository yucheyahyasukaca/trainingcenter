-- ============================================================
-- DEBUG REAL ISSUE - Investigate Actual Problem
-- ============================================================
-- Script ini untuk debug masalah yang sebenarnya
-- ============================================================

-- 1. Cek semua users di auth.users
SELECT 
  'AUTH USERS:' as table_name,
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Cek semua profiles di user_profiles
SELECT 
  'USER PROFILES:' as table_name,
  id,
  email,
  full_name,
  role,
  created_at
FROM user_profiles 
ORDER BY created_at DESC;

-- 3. Cek apakah ada email yucheyahya@gmail.com di kedua table
SELECT 
  'CHECK yucheyahya@gmail.com in auth.users:' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 0 THEN '❌ FOUND'
    ELSE '✅ NOT FOUND'
  END as status
FROM auth.users 
WHERE email = 'yucheyahya@gmail.com'

UNION ALL

SELECT 
  'CHECK yucheyahya@gmail.com in user_profiles:' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 0 THEN '❌ FOUND'
    ELSE '✅ NOT FOUND'
  END as status
FROM user_profiles 
WHERE email = 'yucheyahya@gmail.com';

-- 4. Cek apakah ada email yang mirip (case sensitivity, whitespace, dll)
SELECT 
  'SIMILAR EMAILS in auth.users:' as search_type,
  email,
  LENGTH(email) as email_length,
  created_at
FROM auth.users 
WHERE email ILIKE '%yucheyahya%'
   OR email ILIKE '%yuche%'
   OR email ILIKE '%yahya%'

UNION ALL

SELECT 
  'SIMILAR EMAILS in user_profiles:' as search_type,
  email,
  LENGTH(email) as email_length,
  created_at
FROM user_profiles 
WHERE email ILIKE '%yucheyahya%'
   OR email ILIKE '%yuche%'
   OR email ILIKE '%yahya%';

-- 5. Cek apakah ada constraint atau trigger yang bermasalah
SELECT 
  'CONSTRAINTS on user_profiles:' as info_type,
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'user_profiles'
  AND constraint_type = 'UNIQUE';

-- 6. Cek apakah ada index yang bermasalah
SELECT 
  'INDEXES on user_profiles:' as info_type,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'user_profiles';

-- 7. Cek apakah ada trigger yang bermasalah
SELECT 
  'TRIGGERS:' as info_type,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND (trigger_name LIKE '%user%' OR trigger_name LIKE '%auth%');

-- 8. Cek apakah ada RLS policy yang bermasalah
SELECT 
  'RLS POLICIES on user_profiles:' as info_type,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- ============================================================
-- POSSIBLE CAUSES:
-- ============================================================
-- 1. Email ada di user_profiles tapi tidak di auth.users
-- 2. Case sensitivity issue
-- 3. Whitespace atau karakter aneh
-- 4. Unique constraint bermasalah
-- 5. RLS policy bermasalah
-- 6. Trigger bermasalah
-- 7. Caching issue di Supabase
-- 8. Rate limiting
-- ============================================================
