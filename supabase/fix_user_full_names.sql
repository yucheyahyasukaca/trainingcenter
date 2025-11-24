-- Fix user full_names from auth.users metadata
-- Jalankan SQL ini di Supabase SQL Editor untuk memperbaiki full_name yang kosong atau sama dengan email username

-- Step 1: Update full_name dari auth.users metadata untuk user yang full_name kosong atau sama dengan email username
UPDATE user_profiles up
SET full_name = COALESCE(
    (SELECT raw_user_meta_data->>'full_name' 
     FROM auth.users au 
     WHERE au.id = up.id 
     AND raw_user_meta_data->>'full_name' IS NOT NULL 
     AND raw_user_meta_data->>'full_name' != ''),
    up.full_name
)
WHERE up.full_name IS NULL 
   OR up.full_name = ''
   OR LOWER(REPLACE(up.full_name, ' ', '')) = LOWER(SPLIT_PART(up.email, '@', 1));

-- Step 2: Verifikasi hasil update
SELECT 
    up.email,
    up.full_name as current_full_name,
    au.raw_user_meta_data->>'full_name' as auth_metadata_name,
    CASE 
        WHEN up.full_name IS NULL OR up.full_name = '' THEN '❌ KOSONG'
        WHEN LOWER(REPLACE(up.full_name, ' ', '')) = LOWER(SPLIT_PART(up.email, '@', 1)) THEN '⚠️ SAMA DENGAN EMAIL'
        ELSE '✅ VALID'
    END as status
FROM user_profiles up
LEFT JOIN auth.users au ON au.id = up.id
WHERE up.full_name IS NULL 
   OR up.full_name = ''
   OR LOWER(REPLACE(up.full_name, ' ', '')) = LOWER(SPLIT_PART(up.email, '@', 1))
ORDER BY up.email;

-- Step 3: Manual update untuk user spesifik (jika diperlukan)
-- UPDATE user_profiles 
-- SET full_name = 'Yuche Yahya Sukaca' 
-- WHERE email = 'yucheyahya@gmail.com';

