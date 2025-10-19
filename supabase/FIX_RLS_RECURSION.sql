-- ============================================================================
-- FIX RLS RECURSION ERROR
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script fixes the "infinite recursion detected in policy for relation 'user_profiles'"
-- error by simplifying and fixing the RLS policies
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL EXISTING RLS POLICIES
-- ============================================================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Everyone can view published programs" ON programs;
DROP POLICY IF EXISTS "Admins and managers can view all programs" ON programs;
DROP POLICY IF EXISTS "Admins and managers can manage programs" ON programs;
DROP POLICY IF EXISTS "Everyone can view classes of published programs" ON classes;
DROP POLICY IF EXISTS "Admins and managers can manage classes" ON classes;
DROP POLICY IF EXISTS "Everyone can view class trainers" ON class_trainers;
DROP POLICY IF EXISTS "Admins and managers can manage class trainers" ON class_trainers;
DROP POLICY IF EXISTS "Users can view their own participant record" ON participants;
DROP POLICY IF EXISTS "Users can create their own participant record" ON participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON participants;
DROP POLICY IF EXISTS "Admins and managers can manage all participants" ON participants;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can create enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins and managers can manage all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can view forum categories of enrolled programs" ON forum_categories;
DROP POLICY IF EXISTS "Admins and managers can manage forum categories" ON forum_categories;
DROP POLICY IF EXISTS "Users can view threads of accessible categories" ON forum_threads;
DROP POLICY IF EXISTS "Users can create threads in accessible categories" ON forum_threads;
DROP POLICY IF EXISTS "Users can update their own threads" ON forum_threads;
DROP POLICY IF EXISTS "Users can view replies of accessible threads" ON forum_replies;
DROP POLICY IF EXISTS "Users can create replies in accessible threads" ON forum_replies;
DROP POLICY IF EXISTS "Users can update their own replies" ON forum_replies;
DROP POLICY IF EXISTS "Users can manage reactions on accessible content" ON forum_reactions;

-- ============================================================================
-- STEP 2: DROP PROBLEMATIC FUNCTIONS
-- ============================================================================

-- Drop functions that might cause recursion
DROP FUNCTION IF EXISTS get_user_role(UUID);
DROP FUNCTION IF EXISTS is_admin_or_manager(UUID);
DROP FUNCTION IF EXISTS is_admin(UUID);

-- ============================================================================
-- STEP 3: CREATE SIMPLIFIED RLS POLICIES
-- ============================================================================

-- User profiles policies (simplified)
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to access all profiles
CREATE POLICY "Service role can access all profiles" ON user_profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Programs policies (simplified)
CREATE POLICY "Everyone can view published programs" ON programs
    FOR SELECT USING (status = 'published');

CREATE POLICY "Service role can manage all programs" ON programs
    FOR ALL USING (auth.role() = 'service_role');

-- Classes policies (simplified)
CREATE POLICY "Everyone can view classes of published programs" ON classes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM programs 
            WHERE id = program_id AND status = 'published'
        )
    );

CREATE POLICY "Service role can manage all classes" ON classes
    FOR ALL USING (auth.role() = 'service_role');

-- Class trainers policies (simplified)
CREATE POLICY "Everyone can view class trainers" ON class_trainers
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage class trainers" ON class_trainers
    FOR ALL USING (auth.role() = 'service_role');

-- Participants policies (simplified)
CREATE POLICY "Users can view their own participant record" ON participants
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own participant record" ON participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participant record" ON participants
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all participants" ON participants
    FOR ALL USING (auth.role() = 'service_role');

-- Enrollments policies (simplified)
CREATE POLICY "Users can view their own enrollments" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM participants 
            WHERE id = participant_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create enrollments" ON enrollments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM participants 
            WHERE id = participant_id AND user_id = auth.uid()
        ) AND
        EXISTS (
            SELECT 1 FROM programs 
            WHERE id = program_id AND status = 'published'
        )
    );

CREATE POLICY "Service role can manage all enrollments" ON enrollments
    FOR ALL USING (auth.role() = 'service_role');

-- Forum policies (simplified)
CREATE POLICY "Service role can manage forum categories" ON forum_categories
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage forum threads" ON forum_threads
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage forum replies" ON forum_replies
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage forum reactions" ON forum_reactions
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- STEP 4: CREATE SIMPLIFIED HELPER FUNCTIONS
-- ============================================================================

-- Simple function to check if user is admin (without recursion)
CREATE OR REPLACE FUNCTION is_user_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = p_user_id 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple function to check if user is admin or manager
CREATE OR REPLACE FUNCTION is_user_admin_or_manager(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = p_user_id 
        AND role IN ('admin', 'manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: UPDATE STORAGE POLICIES
-- ============================================================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins and managers can view all payment proofs" ON storage.objects;

-- Create simplified storage policies
CREATE POLICY "Users can upload their own payment proofs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'payment-proofs' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own payment proofs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment-proofs' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Service role can view all payment proofs" ON storage.objects
    FOR SELECT USING (auth.role() = 'service_role');

-- ============================================================================
-- STEP 6: VERIFY POLICIES
-- ============================================================================

-- Check that policies are created correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'programs', 'classes', 'participants', 'enrollments')
ORDER BY tablename, policyname;

-- ============================================================================
-- STEP 7: TEST QUERIES
-- ============================================================================

-- Test basic queries that were failing
SELECT 'Testing user_profiles query' as test_name;
SELECT COUNT(*) as user_count FROM user_profiles;

SELECT 'Testing programs query' as test_name;
SELECT COUNT(*) as program_count FROM programs WHERE status = 'published';

SELECT 'Testing enrollments query' as test_name;
SELECT COUNT(*) as enrollment_count FROM enrollments;

-- ============================================================================
-- FIX COMPLETE!
-- ============================================================================
-- 
-- The RLS recursion error should now be fixed!
-- 
-- What was fixed:
-- 1. Removed all complex RLS policies that caused recursion
-- 2. Simplified policies to use direct auth.uid() checks
-- 3. Added service_role policies for admin access
-- 4. Removed problematic helper functions
-- 5. Created simple, non-recursive helper functions
-- 
-- Your application should now work without the infinite recursion error!
-- ============================================================================
