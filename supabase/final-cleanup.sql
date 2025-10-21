-- ============================================================
-- FINAL CLEANUP - Fix Email Confirmation Error
-- ============================================================
-- Script ini untuk cleanup user yang gagal karena email confirmation
-- ============================================================

-- 1. Hapus user yang gagal karena email confirmation error
DELETE FROM user_profiles WHERE email = 'yucheyahya@gmail.com';
DELETE FROM auth.users WHERE email = 'yucheyahya@gmail.com';

-- 2. Hapus user lain yang mungkin gagal
DELETE FROM user_profiles WHERE email = 'test123@gmail.com';
DELETE FROM auth.users WHERE email = 'test123@gmail.com';

-- 3. Verify clean
SELECT 
  'CLEAN CHECK - auth.users:' as table_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ CLEAN'
    ELSE '❌ STILL EXISTS'
  END as status
FROM auth.users 
WHERE email IN ('yucheyahya@gmail.com', 'test123@gmail.com')

UNION ALL

SELECT 
  'CLEAN CHECK - user_profiles:' as table_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ CLEAN'
    ELSE '❌ STILL EXISTS'
  END as status
FROM user_profiles 
WHERE email IN ('yucheyahya@gmail.com', 'test123@gmail.com');

-- 4. Show remaining users
SELECT 
  'REMAINING USERS:' as info,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================
-- NOTES:
-- ============================================================
-- ✅ Setelah menjalankan script ini:
--    - User yang gagal akan dihapus
--    - Email bisa digunakan lagi
--    - Registrasi ulang akan berhasil
--
-- ⚠️ PENTING: Anda tetap harus disable email confirmation 
--    di Supabase Dashboard:
--    Project Settings → Authentication → 
--    "Enable email confirmations" → OFF
-- ============================================================
