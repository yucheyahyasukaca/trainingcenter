-- ============================================================================
-- FIX PARTICIPANTS RLS RECURSION ERROR
-- ============================================================================
-- Script untuk memperbaiki infinite recursion error pada participants table
--
-- Problem: Policy "Users can view participants via referral" menyebabkan
--          infinite recursion karena mengakses referral_tracking yang juga
--          mengakses participants
-- Solution: Drop policy bermasalah dan buat policy yang lebih sederhana
-- ============================================================================

-- Step 1: Drop ALL existing policies on participants table
-- ============================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all existing policies on participants table
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'participants' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON participants', r.policyname);
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- Step 2: Create simple, non-recursive policies for participants
-- ============================================================================

-- Policy 1: Users can view their own participant record
-- Simple check - no recursion
CREATE POLICY "Users can view their own participant record" ON participants
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Policy 2: Users can create their own participant record
CREATE POLICY "Users can create their own participant record" ON participants
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

-- Policy 3: Users can update their own participant record
CREATE POLICY "Users can update their own participant record" ON participants
    FOR UPDATE USING (
        user_id = auth.uid()
    );

-- Policy 4: Service role can manage all participants (for admin operations)
CREATE POLICY "Service role can manage all participants" ON participants
    FOR ALL USING (
        auth.role() = 'service_role'
    );

-- Note: Policy untuk melihat participants via referral dihapus karena menyebabkan recursion
-- Untuk kebutuhan referral tracking, kita akan handle di level referral_tracking RLS policy

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'participants'
ORDER BY policyname;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'RLS policies for participants fixed successfully!';
    RAISE NOTICE 'Infinite recursion error should be resolved.';
    RAISE NOTICE 'Users can now view their own participant records without recursion.';
END $$;
