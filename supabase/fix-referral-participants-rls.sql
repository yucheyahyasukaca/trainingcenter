-- ============================================================================
-- FIX REFERRAL PARTICIPANTS RLS POLICY
-- ============================================================================
-- Script untuk memperbaiki RLS policy sehingga trainer dapat melihat
-- participant yang menggunakan referral code mereka
--
-- Problem: Trainer tidak bisa melihat participant yang menggunakan
--          referral code mereka karena RLS policy memblokir akses
-- Solution: Tambahkan policy yang mengizinkan trainer melihat participant
--           yang terkait dengan referral_tracking mereka
-- ============================================================================

-- Step 1: Drop ALL existing policies dynamically
-- ============================================================================

-- Drop all existing policies on participants table using dynamic SQL
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

-- Step 2: Create comprehensive policy for participants
-- ============================================================================

-- Policy 1: Users can view their own participant record
CREATE POLICY "Users can view their own participant record" ON participants
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Policy 2: Users (both trainers and regular users) can view participants who used their referral codes
-- This allows any user to see participant info for referrals they created
CREATE POLICY "Users can view participants via referral" ON participants
    FOR SELECT USING (
        -- Check if this participant is referenced in referral_tracking
        -- where the referral code belongs to the current user (via trainer_id)
        -- Note: trainer_id in referral_codes can be any user (not just trainer role)
        EXISTS (
            SELECT 1 
            FROM referral_tracking rt
            JOIN referral_codes rc ON rt.referral_code_id = rc.id
            WHERE rt.participant_id = participants.id
            AND rc.trainer_id = auth.uid()
        )
        OR
        -- Alternative check: via trainer_id directly in referral_tracking
        -- (in case referral_tracking also has trainer_id field)
        EXISTS (
            SELECT 1 
            FROM referral_tracking rt
            WHERE rt.participant_id = participants.id
            AND rt.trainer_id = auth.uid()
        )
        OR
        -- Also allow if user is admin or manager
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.role IN ('admin', 'manager')
        )
    );

-- Policy 3: Users can create their own participant record
CREATE POLICY "Users can create their own participant record" ON participants
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.role IN ('admin', 'manager')
        )
    );

-- Policy 4: Users can update their own participant record
CREATE POLICY "Users can update their own participant record" ON participants
    FOR UPDATE USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.role IN ('admin', 'manager')
        )
    );

-- Policy 5: Admins and managers can manage all participants
CREATE POLICY "Admins and managers can manage all participants" ON participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.role IN ('admin', 'manager')
        )
    );

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
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'participants'
ORDER BY policyname;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'RLS policies for participants updated successfully!';
    RAISE NOTICE 'All users (trainers and regular users) can now view participants who used their referral codes.';
END $$;

