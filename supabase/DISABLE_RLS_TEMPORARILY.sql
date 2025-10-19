-- ============================================================================
-- TEMPORARILY DISABLE RLS FOR TESTING
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script temporarily disables RLS to fix the infinite recursion error
-- Run this if the FIX_RLS_RECURSION.sql doesn't work
-- ============================================================================

-- ============================================================================
-- STEP 1: DISABLE RLS ON ALL TABLES
-- ============================================================================

-- Disable RLS on all tables
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_trainers DISABLE ROW LEVEL SECURITY;
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE forum_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies DISABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reactions DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: DROP ALL POLICIES
-- ============================================================================

-- Drop all policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can access all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Everyone can view published programs" ON programs;
DROP POLICY IF EXISTS "Service role can manage all programs" ON programs;
DROP POLICY IF EXISTS "Everyone can view classes of published programs" ON classes;
DROP POLICY IF EXISTS "Service role can manage all classes" ON classes;
DROP POLICY IF EXISTS "Everyone can view class trainers" ON class_trainers;
DROP POLICY IF EXISTS "Service role can manage class trainers" ON class_trainers;
DROP POLICY IF EXISTS "Users can view their own participant record" ON participants;
DROP POLICY IF EXISTS "Users can create their own participant record" ON participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON participants;
DROP POLICY IF EXISTS "Service role can manage all participants" ON participants;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can create enrollments" ON enrollments;
DROP POLICY IF EXISTS "Service role can manage all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Service role can manage forum categories" ON forum_categories;
DROP POLICY IF EXISTS "Service role can manage forum threads" ON forum_threads;
DROP POLICY IF EXISTS "Service role can manage forum replies" ON forum_replies;
DROP POLICY IF EXISTS "Service role can manage forum reactions" ON forum_reactions;

-- ============================================================================
-- STEP 3: DROP PROBLEMATIC FUNCTIONS
-- ============================================================================

-- Drop all helper functions that might cause issues
DROP FUNCTION IF EXISTS get_user_role(UUID);
DROP FUNCTION IF EXISTS is_admin_or_manager(UUID);
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS is_user_admin(UUID);
DROP FUNCTION IF EXISTS is_user_admin_or_manager(UUID);
DROP FUNCTION IF EXISTS promote_to_manager(UUID, UUID);
DROP FUNCTION IF EXISTS demote_manager(UUID, UUID);
DROP FUNCTION IF EXISTS update_trainer_level(UUID, trainer_level, UUID);
DROP FUNCTION IF EXISTS create_enrollment(UUID, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS get_user_enrollment_status(UUID, UUID);

-- ============================================================================
-- STEP 4: DROP PROBLEMATIC VIEWS
-- ============================================================================

-- Drop views that might cause recursion
DROP VIEW IF EXISTS admin_dashboard_stats;
DROP VIEW IF EXISTS manager_dashboard_stats;
DROP VIEW IF EXISTS user_dashboard_stats;

-- ============================================================================
-- STEP 5: VERIFY RLS IS DISABLED
-- ============================================================================

-- Check that RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'user_profiles', 'programs', 'classes', 'class_trainers', 
    'participants', 'enrollments', 'forum_categories', 
    'forum_threads', 'forum_replies', 'forum_reactions'
)
ORDER BY tablename;

-- ============================================================================
-- STEP 6: TEST BASIC QUERIES
-- ============================================================================

-- Test that basic queries work now
SELECT 'Testing user_profiles query' as test_name;
SELECT COUNT(*) as user_count FROM user_profiles;

SELECT 'Testing programs query' as test_name;
SELECT COUNT(*) as program_count FROM programs;

SELECT 'Testing enrollments query' as test_name;
SELECT COUNT(*) as enrollment_count FROM enrollments;

SELECT 'Testing participants query' as test_name;
SELECT COUNT(*) as participant_count FROM participants;

-- ============================================================================
-- RLS DISABLED!
-- ============================================================================
-- 
-- RLS is now disabled on all tables. Your application should work without errors.
-- 
-- WARNING: This removes all security restrictions!
-- Only use this for testing/development.
-- 
-- To re-enable RLS later, run:
-- ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
-- 
-- ============================================================================
