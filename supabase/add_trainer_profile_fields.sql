-- Add trainer profile fields to user_profiles table
-- Jalankan SQL ini di Supabase SQL Editor

-- Step 1: Add new columns for trainer profile
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS instansi TEXT,
ADD COLUMN IF NOT EXISTS alamat_instansi TEXT,
ADD COLUMN IF NOT EXISTS alamat_pribadi TEXT,
ADD COLUMN IF NOT EXISTS provinsi TEXT,
ADD COLUMN IF NOT EXISTS kabupaten TEXT,
ADD COLUMN IF NOT EXISTS sektor TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Step 2: Check if columns were added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
  AND column_name IN ('instansi', 'alamat_instansi', 'alamat_pribadi', 'provinsi', 'kabupaten', 'sektor', 'whatsapp')
ORDER BY column_name;

-- Step 3: Test insert/update (optional - untuk testing)
-- UPDATE user_profiles 
-- SET instansi = 'Test Instansi'
-- WHERE id = 'your-user-id-here';
