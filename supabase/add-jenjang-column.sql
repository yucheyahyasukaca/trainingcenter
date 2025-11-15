-- ============================================================================
-- ADD JENJANG COLUMN TO USER_PROFILES TABLE
-- Script untuk menambahkan kolom jenjang ke table user_profiles
-- ============================================================================

-- Step 1: Add jenjang column to user_profiles table
-- ============================================================================
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS jenjang TEXT;

-- Step 2: Add comment to column for documentation
-- ============================================================================
COMMENT ON COLUMN user_profiles.jenjang IS 'Jenjang pendidikan: TK, SD, SMP, SMA, Universitas';

-- Step 3: Verify column was added
-- ============================================================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
  AND column_name = 'jenjang';

-- Step 4: Optional - Add check constraint for jenjang values
-- Uncomment this if you want to enforce specific values
-- ============================================================================
-- ALTER TABLE user_profiles 
-- ADD CONSTRAINT check_jenjang 
-- CHECK (jenjang IS NULL OR jenjang IN ('TK', 'SD', 'SMP', 'SMA', 'Universitas'));

-- ============================================================================
-- NOTE: 
-- - Kolom jenjang sekarang sudah ditambahkan
-- - User bisa mengisi manual melalui form edit profile
-- - Jenjang akan digunakan untuk statistik pendaftaran program
-- ============================================================================

