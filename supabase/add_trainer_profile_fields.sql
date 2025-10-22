-- Add trainer profile fields to user_profiles table
-- Jalankan SQL ini di Supabase SQL Editor

-- Add new columns for trainer profile
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS instansi TEXT,
ADD COLUMN IF NOT EXISTS alamat_instansi TEXT,
ADD COLUMN IF NOT EXISTS alamat_pribadi TEXT,
ADD COLUMN IF NOT EXISTS provinsi TEXT,
ADD COLUMN IF NOT EXISTS kabupaten TEXT,
ADD COLUMN IF NOT EXISTS sektor TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Update existing records with default values if needed
UPDATE user_profiles 
SET 
  instansi = COALESCE(instansi, ''),
  alamat_instansi = COALESCE(alamat_instansi, ''),
  alamat_pribadi = COALESCE(alamat_pribadi, ''),
  provinsi = COALESCE(provinsi, ''),
  kabupaten = COALESCE(kabupaten, ''),
  sektor = COALESCE(sektor, ''),
  whatsapp = COALESCE(whatsapp, '')
WHERE instansi IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
  AND column_name IN ('instansi', 'alamat_instansi', 'alamat_pribadi', 'provinsi', 'kabupaten', 'sektor', 'whatsapp')
ORDER BY column_name;
