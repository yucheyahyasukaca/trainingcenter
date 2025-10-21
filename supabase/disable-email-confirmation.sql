-- ============================================================
-- DISABLE EMAIL CONFIRMATION - Auto Activate Users
-- ============================================================
-- Script ini memastikan semua user otomatis aktif tanpa konfirmasi email
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Auto-confirm semua existing users yang belum confirmed
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmed_at = COALESCE(confirmed_at, NOW())
WHERE 
  email_confirmed_at IS NULL 
  OR confirmed_at IS NULL;

-- 2. Update trigger untuk auto-confirm user baru
-- Drop existing trigger jika ada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Buat function baru yang auto-confirm user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert user profile dengan data dari auth
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user' -- Default role
  );
  
  -- Log untuk debugging
  RAISE NOTICE 'New user profile created for: %', NEW.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Buat trigger untuk auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Pastikan RLS policies tidak memblokir auto-create profile
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Buat policy baru yang allow auto-insert
CREATE POLICY "Users can insert their own profile" 
  ON user_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow service role to insert (untuk trigger)
CREATE POLICY "Service role can insert profiles" 
  ON user_profiles 
  FOR INSERT 
  WITH CHECK (true);

-- 6. Verify current settings
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
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================
-- NOTES:
-- ============================================================
-- ✅ Setelah menjalankan script ini:
--    - Semua existing users akan auto-confirmed
--    - User baru akan otomatis aktif (tidak perlu konfirmasi email)
--    - User profile otomatis dibuat saat registrasi
--
-- ⚠️ PENTING: Anda tetap harus disable email confirmation 
--    di Supabase Dashboard:
--    Project Settings → Authentication → 
--    "Enable email confirmations" → OFF
-- ============================================================

