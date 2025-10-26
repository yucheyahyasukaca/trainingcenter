-- ============================================================================
-- FIX TRAINERS RLS - PUBLIC ACCESS
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script enables public access to trainers table without authentication
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: ENABLE RLS ON TRAINERS TABLE (IF NOT ALREADY ENABLED)
-- ============================================================================

ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: DROP ALL EXISTING POLICIES (IF ANY)
-- ============================================================================

DROP POLICY IF EXISTS "Enable read access for all users" ON trainers;
DROP POLICY IF EXISTS "Enable insert for all users" ON trainers;
DROP POLICY IF EXISTS "Enable update for all users" ON trainers;
DROP POLICY IF EXISTS "Enable delete for all users" ON trainers;
DROP POLICY IF EXISTS "trainers_select" ON trainers;
DROP POLICY IF EXISTS "trainers_insert" ON trainers;
DROP POLICY IF EXISTS "trainers_update" ON trainers;
DROP POLICY IF EXISTS "trainers_delete" ON trainers;
DROP POLICY IF EXISTS "Everyone can view trainers" ON trainers;
DROP POLICY IF EXISTS "Public can view trainers" ON trainers;

-- ============================================================================
-- STEP 3: CREATE PUBLIC READ POLICY FOR TRAINERS
-- ============================================================================

-- Allow everyone (including anonymous users) to SELECT from trainers table
CREATE POLICY "Public can view trainers" ON trainers
    FOR SELECT USING (true);

-- Optional: Allow authenticated users to manage trainers
-- Uncomment if you want authenticated users to insert/update/delete

-- CREATE POLICY "Authenticated can insert trainers" ON trainers
--     FOR INSERT WITH CHECK (auth.role() = 'authenticated');
--
-- CREATE POLICY "Authenticated can update trainers" ON trainers
--     FOR UPDATE USING (auth.role() = 'authenticated');
--
-- CREATE POLICY "Authenticated can delete trainers" ON trainers
--     FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Check if the policy was created successfully
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'trainers';
