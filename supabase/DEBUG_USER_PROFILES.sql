-- ========================================
-- DEBUG USER_PROFILES TABLE
-- ========================================
-- Jalankan query ini satu per satu di Supabase SQL Editor
-- Beri tahu hasilnya untuk setiap query

-- 1. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 2. Check data lengkap
SELECT id, email, full_name, role, created_at, updated_at
FROM user_profiles
ORDER BY email;

-- 3. Check if auth.users exists
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- 4. Check auth users data
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email LIKE '%garuda21.com'
ORDER BY email;

-- 5. Check constraints
SELECT conname, contype, confrelid::regclass
FROM pg_constraint 
WHERE conrelid = 'user_profiles'::regclass;

-- 6. Test basic query (yang digunakan aplikasi)
SELECT * FROM user_profiles 
WHERE email = 'admin@garuda21.com'
LIMIT 1;
