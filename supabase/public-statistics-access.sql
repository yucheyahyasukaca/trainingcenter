-- ============================================================================
-- PUBLIC STATISTICS ACCESS
-- Script untuk membuat statistik pendaftaran program bisa diakses publik
-- tanpa perlu login
-- 
-- IMPORTANT: Run each section separately to avoid deadlock issues
-- ============================================================================

-- ============================================================================
-- SECTION 1: Enable RLS (if not already enabled)
-- Run this first
-- ============================================================================
DO $$
BEGIN
  -- Enable RLS on tables if not already enabled
  ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  -- Tables might already have RLS enabled, ignore error
  NULL;
END $$;

-- ============================================================================
-- SECTION 2: Drop existing public access policies and functions (if exist)
-- Run this second
-- ============================================================================
DO $$
BEGIN
  -- Drop existing enrollments public policies
  DROP POLICY IF EXISTS "Public can view enrollments for published programs" ON enrollments;
  
  -- Drop existing participants public policies
  DROP POLICY IF EXISTS "Public can view participants for enrollment stats" ON participants;
  
  -- Drop existing user_profiles public policies  
  DROP POLICY IF EXISTS "Public can view user profiles for enrollment stats" ON user_profiles;
  
  -- Drop existing programs public policies
  DROP POLICY IF EXISTS "Public can view published programs" ON programs;
  DROP POLICY IF EXISTS "Everyone can view published programs" ON programs;

  -- Drop helper functions if they exist
  DROP FUNCTION IF EXISTS public.is_published_program(UUID);
  DROP FUNCTION IF EXISTS public.has_published_enrollment(UUID);
  DROP FUNCTION IF EXISTS public.user_has_published_enrollment(UUID);
EXCEPTION WHEN OTHERS THEN
  -- Policies/functions might not exist, ignore error
  NULL;
END $$;

-- ============================================================================
-- SECTION 3: Create public access policy for programs table
-- Run this third (MUST BE FIRST because other policies depend on it)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'programs' 
    AND policyname = 'Public can view published programs'
  ) THEN
    CREATE POLICY "Public can view published programs" ON programs
    FOR SELECT 
    USING (status = 'published');
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating programs policy: %', SQLERRM;
END $$;

-- ============================================================================
-- SECTION 4A: Create helper function for programs check
-- Run this before SECTION 4B
-- ============================================================================
-- Use a SECURITY DEFINER function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_published_program(p_program_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM programs 
    WHERE id = p_program_id 
    AND status = 'published'
  );
END;
$$;

-- ============================================================================
-- SECTION 4B: Create public access policy for enrollments table
-- Run this after SECTION 4A
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'enrollments' 
    AND policyname = 'Public can view enrollments for published programs'
  ) THEN
    CREATE POLICY "Public can view enrollments for published programs" ON enrollments
    FOR SELECT 
    USING (public.is_published_program(program_id));
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating enrollments policy: %', SQLERRM;
END $$;

-- ============================================================================
-- SECTION 5A: Create helper function for participants check
-- Run this before SECTION 5B
-- ============================================================================
-- Create helper function to check if participant has published program enrollments
CREATE OR REPLACE FUNCTION public.has_published_enrollment(p_participant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.participant_id = p_participant_id 
    AND public.is_published_program(e.program_id)
  );
END;
$$;

-- ============================================================================
-- SECTION 5B: Create public access policy for participants table
-- Run this after SECTION 5A
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'participants' 
    AND policyname = 'Public can view participants for enrollment stats'
  ) THEN
    CREATE POLICY "Public can view participants for enrollment stats" ON participants
    FOR SELECT 
    USING (public.has_published_enrollment(id));
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating participants policy: %', SQLERRM;
END $$;

-- ============================================================================
-- SECTION 6A: Create helper function for user_profiles check
-- Run this before SECTION 6B
-- ============================================================================
-- Create helper function to check if user has published program enrollments
CREATE OR REPLACE FUNCTION public.user_has_published_enrollment(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM participants part
    JOIN enrollments e ON e.participant_id = part.id
    WHERE part.user_id = p_user_id 
    AND public.is_published_program(e.program_id)
  );
END;
$$;

-- ============================================================================
-- SECTION 6B: Create public access policy for user_profiles table
-- Run this after SECTION 6A
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Public can view user profiles for enrollment stats'
  ) THEN
    CREATE POLICY "Public can view user profiles for enrollment stats" ON user_profiles
    FOR SELECT 
    USING (public.user_has_published_enrollment(id));
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating user_profiles policy: %', SQLERRM;
END $$;

-- ============================================================================
-- SECTION 7: Grant SELECT permission to anon role
-- Run this seventh
-- ============================================================================
DO $$
BEGIN
  GRANT SELECT ON programs TO anon;
  GRANT SELECT ON enrollments TO anon;
  GRANT SELECT ON participants TO anon;
  GRANT SELECT ON user_profiles TO anon;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error granting permissions: %', SQLERRM;
END $$;

-- ============================================================================
-- SECTION 8: Create policies for authenticated users (optional)
-- Only run this if you want to ensure authenticated users can access their own data
-- These policies might already exist in your system
-- ============================================================================
DO $$
BEGIN
  -- Enrollments policy for authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'enrollments' 
    AND policyname = 'Users can view their own enrollments'
  ) THEN
    CREATE POLICY "Users can view their own enrollments" ON enrollments
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM participants 
        WHERE participants.id = enrollments.participant_id 
        AND participants.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('admin', 'manager')
      )
    );
  END IF;

  -- Participants policy for authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'participants' 
    AND policyname = 'Users can view their own participant record'
  ) THEN
    CREATE POLICY "Users can view their own participant record" ON participants
    FOR SELECT 
    USING (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('admin', 'manager')
      )
    );
  END IF;

  -- User_profiles policy for authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT 
    USING (id = auth.uid());
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating authenticated user policies: %', SQLERRM;
END $$;

-- ============================================================================
-- VERIFICATION
-- Run these queries to verify the policies are working:
-- ============================================================================
-- 
-- 1. Test as anon user (in Supabase SQL Editor, switch to anon role):
--    SELECT COUNT(*) FROM enrollments 
--    INNER JOIN programs ON programs.id = enrollments.program_id 
--    WHERE programs.status = 'published';
--
-- 2. Test participant access as anon:
--    SELECT p.* FROM participants p
--    INNER JOIN enrollments e ON e.participant_id = p.id
--    INNER JOIN programs pr ON pr.id = e.program_id
--    WHERE pr.status = 'published'
--    LIMIT 1;
--
-- 3. Test user_profiles access as anon:
--    SELECT up.jenjang, up.provinsi, up.kabupaten FROM user_profiles up
--    INNER JOIN participants p ON p.user_id = up.id
--    INNER JOIN enrollments e ON e.participant_id = p.id
--    INNER JOIN programs pr ON pr.id = e.program_id
--    WHERE pr.status = 'published'
--    LIMIT 1;
--
-- 4. Test nested query (like the component uses):
--    SELECT e.id, e.status, e.participant_id,
--           p.id as participant_id, p.user_id,
--           up.jenjang, up.provinsi, up.kabupaten
--    FROM enrollments e
--    JOIN participants p ON p.id = e.participant_id
--    JOIN user_profiles up ON up.id = p.user_id
--    JOIN programs pr ON pr.id = e.program_id
--    WHERE pr.status = 'published'
--    LIMIT 5;
-- ============================================================================

