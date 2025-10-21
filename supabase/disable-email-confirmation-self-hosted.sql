-- ============================================================
-- DISABLE EMAIL CONFIRMATION - Supabase Self-Hosted
-- ============================================================
-- Script ini untuk disable email confirmation di Supabase self-hosted
-- ============================================================

-- 1. Cek current setting
SELECT 
  'CURRENT SETTING:' as info,
  raw_app_meta_data->>'email_confirmation_enabled' as email_confirmation_enabled,
  raw_app_meta_data
FROM auth.config;

-- 2. Disable email confirmation
UPDATE auth.config 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb), 
  '{email_confirmation_enabled}', 
  'false'::jsonb
);

-- 3. Verify setting updated
SELECT 
  'UPDATED SETTING:' as info,
  raw_app_meta_data->>'email_confirmation_enabled' as email_confirmation_enabled,
  raw_app_meta_data
FROM auth.config;

-- 4. Alternative method - Update via auth.config table
-- (Jika method di atas tidak bekerja)
UPDATE auth.config 
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"email_confirmation_enabled": false}'::jsonb;

-- 5. Verify final setting
SELECT 
  'FINAL SETTING:' as info,
  raw_app_meta_data->>'email_confirmation_enabled' as email_confirmation_enabled,
  CASE 
    WHEN raw_app_meta_data->>'email_confirmation_enabled' = 'false' THEN '✅ DISABLED'
    WHEN raw_app_meta_data->>'email_confirmation_enabled' = 'true' THEN '❌ ENABLED'
    ELSE '⚠️ NOT SET'
  END as status
FROM auth.config;

-- ============================================================
-- NOTES:
-- ============================================================
-- ✅ Setelah menjalankan script ini:
--    - Email confirmation akan disabled
--    - User registrasi langsung aktif
--    - Tidak perlu konfirmasi email
--
-- ⚠️ PENTING: Restart Supabase setelah menjalankan script ini
--    supabase stop && supabase start
-- ============================================================
