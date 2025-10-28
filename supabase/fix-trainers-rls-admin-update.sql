-- ============================================================================
-- FIX TRAINERS RLS - ALLOW ADMIN/MANAGER TO UPDATE
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script fixes RLS policies to allow admin and manager to update trainers
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL EXISTING UPDATE POLICIES ON TRAINERS
-- ============================================================================

DROP POLICY IF EXISTS "Enable update for all users" ON trainers;
DROP POLICY IF EXISTS "trainers_update" ON trainers;
DROP POLICY IF EXISTS "Admin and Manager can update trainers" ON trainers;
DROP POLICY IF EXISTS "Admin can update trainers" ON trainers;
DROP POLICY IF EXISTS "Public can update trainers" ON trainers;
DROP POLICY IF EXISTS "Authenticated can update trainers" ON trainers;

-- ============================================================================
-- STEP 2: CREATE ADMIN/MANAGER UPDATE POLICY
-- ============================================================================

-- Policy untuk admin dan manager bisa update semua trainer
CREATE POLICY "Admin and Manager can update trainers" ON trainers
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- ============================================================================
-- STEP 3: KEEP EXISTING READ, INSERT, DELETE POLICIES
-- ============================================================================

-- Ensure read access for all (keep existing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'trainers' 
        AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON trainers
            FOR SELECT USING (true);
    END IF;
END $$;

-- Ensure insert access for all authenticated (keep existing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'trainers' 
        AND policyname = 'Enable insert for all users'
    ) THEN
        CREATE POLICY "Enable insert for all users" ON trainers
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Ensure delete access for admin/manager
DROP POLICY IF EXISTS "Admin and Manager can delete trainers" ON trainers;
CREATE POLICY "Admin and Manager can delete trainers" ON trainers
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- ============================================================================
-- STEP 4: VERIFY POLICIES
-- ============================================================================

-- List all policies on trainers table
SELECT 
    policyname, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'trainers'
ORDER BY policyname;

-- ============================================================================
-- STEP 5: TEST QUERY (Optional - comment out in production)
-- ============================================================================

-- This should show the current user's role
-- SELECT auth.uid(), role FROM user_profiles WHERE id = auth.uid();

SELECT 'Trainers RLS policies updated successfully!' as message;

