-- Temporarily disable RLS for referral tables for debugging
-- Run this script in Supabase SQL Editor

-- Disable RLS on referral tables temporarily
ALTER TABLE referral_codes DISABLE ROW LEVEL SECURITY;

-- Check if referral_tracking table exists and disable RLS if it does
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_tracking') THEN
        ALTER TABLE referral_tracking DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled for referral_tracking table';
    END IF;
END $$;

SELECT 'RLS temporarily disabled for referral tables for debugging' as message;
