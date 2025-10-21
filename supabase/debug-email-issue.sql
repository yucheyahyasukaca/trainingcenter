-- ============================================================
-- DEBUG EMAIL ISSUE - Investigate Why Email Still "Exists"
-- ============================================================
-- Script ini untuk debug kenapa email masih error "sudah terdaftar"
-- padahal tidak ada di auth.users
-- ============================================================

-- 1. Cek semua users di auth.users
SELECT 
  'AUTH USERS TABLE:' as table_name,
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Cek semua profiles di user_profiles
SELECT 
  'USER PROFILES TABLE:' as table_name,
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
    WHEN COUNT(*) > 0 THEN '❌ FOUND - Email exists'
    ELSE '✅ NOT FOUND - Email clean'
  END as status
FROM auth.users 
WHERE email = 'yucheyahya@gmail.com'

UNION ALL

SELECT 
  'CHECK yucheyahya@gmail.com in user_profiles:' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 0 THEN '❌ FOUND - Profile exists'
    ELSE '✅ NOT FOUND - Profile clean'
  END as status
FROM user_profiles 
WHERE email = 'yucheyahya@gmail.com';

-- 4. Cek semua email yang mengandung "yucheyahya"
SELECT 
  'SEARCH yucheyahya in auth.users:' as search_type,
  email,
  created_at
FROM auth.users 
WHERE email ILIKE '%yucheyahya%'

UNION ALL

SELECT 
  'SEARCH yucheyahya in user_profiles:' as search_type,
  email,
  created_at
FROM user_profiles 
WHERE email ILIKE '%yucheyahya%';

-- 5. Cek apakah ada case sensitivity issue
SELECT 
  'CASE SENSITIVE CHECK:' as check_type,
  email,
  LOWER(email) as lower_email,
  created_at
FROM auth.users 
WHERE LOWER(email) = 'yucheyahya@gmail.com'

UNION ALL

SELECT 
  'CASE SENSITIVE CHECK:' as check_type,
  email,
  LOWER(email) as lower_email,
  created_at
FROM user_profiles 
WHERE LOWER(email) = 'yucheyahya@gmail.com';

-- 6. Cek apakah ada whitespace atau karakter aneh
SELECT 
  'WHITESPACE CHECK:' as check_type,
  email,
  LENGTH(email) as email_length,
  ASCII(SUBSTRING(email, 1, 1)) as first_char_ascii,
  ASCII(SUBSTRING(email, -1, 1)) as last_char_ascii
FROM auth.users 
WHERE email LIKE '%yucheyahya%'

UNION ALL

SELECT 
  'WHITESPACE CHECK:' as check_type,
  email,
  LENGTH(email) as email_length,
  ASCII(SUBSTRING(email, 1, 1)) as first_char_ascii,
  ASCII(SUBSTRING(email, -1, 1)) as last_char_ascii
FROM user_profiles 
WHERE email LIKE '%yucheyahya%';

-- 7. Cek recent failed attempts (jika ada log table)
-- Note: Supabase mungkin tidak menyimpan failed attempts, tapi coba cek

-- 8. Cek apakah ada constraint atau trigger yang bermasalah
SELECT 
  'TRIGGER INFO:' as info_type,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name LIKE '%user%';

-- ============================================================
-- POSSIBLE CAUSES:
-- ============================================================
-- 1. Email ada di user_profiles tapi tidak di auth.users
-- 2. Case sensitivity issue (YucheYahya@gmail.com vs yucheyahya@gmail.com)
-- 3. Whitespace atau karakter aneh di email
-- 4. Caching issue di Supabase
-- 5. Rate limiting dari Supabase
-- 6. Email ada di table lain yang tidak terlihat
-- ============================================================
