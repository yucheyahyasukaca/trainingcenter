-- ============================================================================
-- FIX REFERRAL TRACKING RLS POLICY FOR PARTICIPANTS
-- ============================================================================
-- Script untuk memperbaiki RLS policy sehingga participant dapat melihat
-- referral tracking mereka sendiri (untuk cek apakah mereka sudah menggunakan referral)
--
-- Problem: Participant tidak bisa melihat referral_tracking mereka sendiri
--          karena RLS policy hanya mengizinkan trainer melihat tracking mereka
-- Solution: Tambahkan policy yang mengizinkan participant melihat tracking
--           dimana mereka adalah participant_id
-- ============================================================================

-- Step 1: Enable RLS if not already enabled
-- ============================================================================
ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing SELECT policy if exists (we'll recreate it)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view referral tracking for their enrollments" ON referral_tracking;
DROP POLICY IF EXISTS "Trainers can view their own referral tracking" ON referral_tracking;
DROP POLICY IF EXISTS "Participants can view their own referral tracking" ON referral_tracking;
DROP POLICY IF EXISTS "Users can view their own referral tracking" ON referral_tracking;

-- Step 3: Create comprehensive RLS policy for referral_tracking SELECT
-- ============================================================================

-- Policy: Allow participants to view their own referral tracking
-- This allows users to see tracking records where they are the participant
CREATE POLICY "Participants can view their own referral tracking" ON referral_tracking
FOR SELECT USING (
    -- Participant can view if their user_id matches the participant's user_id in tracking
    EXISTS (
        SELECT 1 FROM participants p
        WHERE p.id = referral_tracking.participant_id
        AND p.user_id = auth.uid()
    )
    OR
    -- Trainer can view tracking where they are the trainer
    trainer_id = auth.uid()
    OR
    -- Admin/manager can view all
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.role IN ('admin', 'manager')
    )
);

-- Step 4: Verify the policy is created
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'referral_tracking'
AND cmd = 'SELECT'
ORDER BY policyname;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'RLS policy for referral_tracking updated successfully!';
    RAISE NOTICE 'Participants can now view their own referral tracking records.';
    RAISE NOTICE 'Trainers can still view tracking for referrals they created.';
END $$;
