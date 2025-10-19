-- ========================================
-- FIX LOGIN ERROR - SIMPLE VERSION
-- ========================================
-- Copy SEMUA SQL di bawah ini
-- Paste ke Supabase SQL Editor
-- Klik RUN
-- ========================================

-- 1. Create table user_profiles (PENTING!)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Disable RLS (untuk development)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. Verify table created
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles';

-- Jika berhasil, akan muncul:
-- tablename
-- -------------
-- user_profiles

