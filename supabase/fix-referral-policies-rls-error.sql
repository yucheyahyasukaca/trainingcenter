-- ============================================================================
-- FIX REFERRAL POLICIES RLS ERROR
-- ============================================================================
-- Script untuk memperbaiki error 500 pada referral_policies dan programs
-- Error terjadi karena admin tidak bisa membaca data via join
-- ============================================================================

-- Ensure helper function exists
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

-- ============================================================================
-- STEP 1: FIX REFERRAL_POLICIES TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admin can view all referral policies" ON referral_policies;
DROP POLICY IF EXISTS "Admin can manage all referral policies" ON referral_policies;
DROP POLICY IF EXISTS "Trainers can view policies for their programs" ON referral_policies;
DROP POLICY IF EXISTS "Everyone can view active referral policies" ON referral_policies;

-- Create comprehensive policies for referral_policies
CREATE POLICY "Admin can view all referral policies" ON referral_policies
FOR SELECT USING (is_user_admin(auth.uid()));

CREATE POLICY "Admin can manage all referral policies" ON referral_policies
FOR ALL USING (is_user_admin(auth.uid()));

-- Allow everyone to view active policies (for public access)
CREATE POLICY "Everyone can view active referral policies" ON referral_policies
FOR SELECT USING (is_active = true);

-- ============================================================================
-- STEP 2: VERIFY PROGRAMS POLICIES (re-apply admin access)
-- ============================================================================

-- Drop existing policies if needed
DROP POLICY IF EXISTS "Admin can view all programs" ON programs;
DROP POLICY IF EXISTS "Admin can manage all programs" ON programs;

-- Create admin policies for programs (if not exists)
CREATE POLICY "Admin can view all programs" ON programs
FOR SELECT USING (is_user_admin(auth.uid()));

CREATE POLICY "Admin can manage all programs" ON programs
FOR ALL USING (is_user_admin(auth.uid()));

-- ============================================================================
-- STEP 3: VERIFY USER_PROFILES POLICIES (re-apply admin access)
-- ============================================================================

-- Drop existing policies if needed
DROP POLICY IF EXISTS "Admin can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON user_profiles;

-- Create admin policies for user_profiles (if not exists)
CREATE POLICY "Admin can view all profiles" ON user_profiles
FOR SELECT USING (is_user_admin(auth.uid()));

CREATE POLICY "Admin can update all profiles" ON user_profiles
FOR UPDATE USING (is_user_admin(auth.uid()));

-- ============================================================================
-- STEP 4: TEST QUERIES (should work for admin)
-- ============================================================================

-- Test query similar to what API does
SELECT 
    'Testing referral_policies query' as test,
    COUNT(*) as total_policies
FROM referral_policies;

-- Test join query
SELECT 
    'Testing join query' as test,
    COUNT(*) as total_with_joins
FROM referral_policies rp
JOIN programs p ON rp.program_id = p.id
LEFT JOIN user_profiles up ON rp.created_by = up.id;
