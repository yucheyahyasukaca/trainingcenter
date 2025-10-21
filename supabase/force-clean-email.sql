-- ============================================================
-- FORCE CLEAN EMAIL - Nuclear Option
-- ============================================================
-- Script ini akan menghapus SEMUA kemungkinan email yucheyahya@gmail.com
-- dari semua table yang mungkin menyimpannya
-- ============================================================

-- 1. Hapus dari user_profiles dengan berbagai kemungkinan
DELETE FROM user_profiles 
WHERE email = 'yucheyahya@gmail.com'
   OR LOWER(email) = 'yucheyahya@gmail.com'
   OR TRIM(email) = 'yucheyahya@gmail.com'
   OR email ILIKE '%yucheyahya%';

-- 2. Hapus dari auth.users dengan berbagai kemungkinan
DELETE FROM auth.users 
WHERE email = 'yucheyahya@gmail.com'
   OR LOWER(email) = 'yucheyahya@gmail.com'
   OR TRIM(email) = 'yucheyahya@gmail.com'
   OR email ILIKE '%yucheyahya%';

-- 3. Cek apakah ada di table lain yang mungkin
-- (Ini untuk jaga-jaga jika ada table lain)
DELETE FROM participants 
WHERE email = 'yucheyahya@gmail.com'
   OR LOWER(email) = 'yucheyahya@gmail.com'
   OR TRIM(email) = 'yucheyahya@gmail.com'
   OR email ILIKE '%yucheyahya%';

DELETE FROM trainers 
WHERE email = 'yucheyahya@gmail.com'
   OR LOWER(email) = 'yucheyahya@gmail.com'
   OR TRIM(email) = 'yucheyahya@gmail.com'
   OR email ILIKE '%yucheyahya%';

-- 4. Verify semua table sudah bersih
SELECT 
  'FINAL CHECK - auth.users:' as table_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ CLEAN'
    ELSE '❌ STILL EXISTS'
  END as status
FROM auth.users 
WHERE email ILIKE '%yucheyahya%'

UNION ALL

SELECT 
  'FINAL CHECK - user_profiles:' as table_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ CLEAN'
    ELSE '❌ STILL EXISTS'
  END as status
FROM user_profiles 
WHERE email ILIKE '%yucheyahya%'

UNION ALL

SELECT 
  'FINAL CHECK - participants:' as table_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ CLEAN'
    ELSE '❌ STILL EXISTS'
  END as status
FROM participants 
WHERE email ILIKE '%yucheyahya%'

UNION ALL

SELECT 
  'FINAL CHECK - trainers:' as table_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ CLEAN'
    ELSE '❌ STILL EXISTS'
  END as status
FROM trainers 
WHERE email ILIKE '%yucheyahya%';

-- 5. Show all remaining users (untuk reference)
SELECT 
  'REMAINING USERS:' as info,
  email,
  created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================
-- NOTES:
-- ============================================================
-- ✅ Script ini akan:
--    1. Hapus email dari semua kemungkinan table
--    2. Handle case sensitivity, whitespace, dll
--    3. Verify semua table sudah bersih
--    4. Show remaining users untuk reference
--
-- ⚠️ Setelah script ini:
--    - Email yucheyahya@gmail.com HARUS bersih
--    - Bisa registrasi ulang tanpa error
--    - Jika masih error, kemungkinan ada masalah lain
-- ============================================================
