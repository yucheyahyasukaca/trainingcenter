-- ============================================================
-- CLEANUP FAILED REGISTRATION - Fix Email Already Exists Error
-- ============================================================
-- Script ini membersihkan user yang gagal registrasi
-- dan memastikan email bisa digunakan lagi
-- ============================================================

-- 1. Cek apakah email yucheyahya@gmail.com ada di database
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
    ELSE '❌ Not Confirmed'
  END as status
FROM auth.users 
WHERE email = 'yucheyahya@gmail.com';

-- 2. Cek apakah ada profile untuk user ini
SELECT * FROM user_profiles 
WHERE email = 'yucheyahya@gmail.com';

-- 3. Hapus user yang gagal registrasi (jika ada)
-- Hapus dari user_profiles dulu (foreign key constraint)
DELETE FROM user_profiles 
WHERE email = 'yucheyahya@gmail.com';

-- Hapus dari auth.users
DELETE FROM auth.users 
WHERE email = 'yucheyahya@gmail.com';

-- 4. Verify email sudah bersih
SELECT 
  'After cleanup - Users table:' as info,
  COUNT(*) as count
FROM auth.users 
WHERE email = 'yucheyahya@gmail.com'

UNION ALL

SELECT 
  'After cleanup - Profiles table:' as info,
  COUNT(*) as count
FROM user_profiles 
WHERE email = 'yucheyahya@gmail.com';

-- 5. Cek semua users yang ada sekarang
SELECT 
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  CASE 
    WHEN confirmed_at IS NOT NULL THEN '✅ Active'
    ELSE '❌ Inactive'
  END as status
FROM auth.users 
ORDER BY created_at DESC;

-- ============================================================
-- NOTES:
-- ============================================================
-- ✅ Script ini akan:
--    1. Cek status email yucheyahya@gmail.com
--    2. Hapus user yang gagal registrasi
--    3. Bersihkan profile yang tidak lengkap
--    4. Verify email bisa digunakan lagi
--
-- ⚠️ Setelah menjalankan script ini:
--    - Email yucheyahya@gmail.com bisa digunakan lagi
--    - Registrasi ulang akan berhasil
--    - User akan otomatis aktif (karena email confirmation disabled)
-- ============================================================
