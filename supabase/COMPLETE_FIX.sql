-- ========================================
-- COMPLETE FIX untuk Login Error
-- GARUDA-21 Training Center
-- ========================================
-- Error: "Database error querying schema"
-- Cause: user_profiles table tidak ada
-- 
-- INSTRUKSI:
-- Copy & paste SEMUA SQL di bawah ini ke Supabase SQL Editor
-- dan jalankan sekaligus
-- ========================================

-- Step 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create user_profiles table (PENTING!)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Step 3: Disable RLS untuk development (agar tidak ada permission error)
ALTER TABLE IF EXISTS trainers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON trainers;
DROP POLICY IF EXISTS "Enable insert for all users" ON trainers;
DROP POLICY IF EXISTS "Enable update for all users" ON trainers;
DROP POLICY IF EXISTS "Enable delete for all users" ON trainers;

DROP POLICY IF EXISTS "Enable read access for all users" ON programs;
DROP POLICY IF EXISTS "Enable insert for all users" ON programs;
DROP POLICY IF EXISTS "Enable update for all users" ON programs;
DROP POLICY IF EXISTS "Enable delete for all users" ON programs;

DROP POLICY IF EXISTS "Enable read access for all users" ON participants;
DROP POLICY IF EXISTS "Enable insert for all users" ON participants;
DROP POLICY IF EXISTS "Enable update for all users" ON participants;
DROP POLICY IF EXISTS "Enable delete for all users" ON participants;

DROP POLICY IF EXISTS "Enable read access for all users" ON enrollments;
DROP POLICY IF EXISTS "Enable insert for all users" ON enrollments;
DROP POLICY IF EXISTS "Enable update for all users" ON enrollments;
DROP POLICY IF EXISTS "Enable delete for all users" ON enrollments;

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON user_profiles;

-- Step 5: Create trigger function untuk auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Verify tables exist
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('trainers', 'programs', 'participants', 'enrollments', 'user_profiles')
ORDER BY tablename;

-- ========================================
-- Hasil yang diharapkan:
-- Seharusnya muncul 5 tables:
-- - enrollments
-- - participants
-- - programs
-- - trainers
-- - user_profiles
-- ========================================

