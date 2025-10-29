-- ============================================================================
-- CHECK AND FIX ENROLLMENT REFERRAL_CODE_ID
-- ============================================================================
-- Script untuk muriksa dan memperbaiki referral_code_id di tabel enrollments
-- ============================================================================

-- Step 1: Check if referral_code_id column exists
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'enrollments'
AND column_name = 'referral_code_id';

-- Step 2: Add referral_code_id column if it doesn't exist
-- ============================================================================
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS referral_code_id UUID REFERENCES referral_codes(id) ON DELETE SET NULL;

-- Also ensure referral_discount and final_price columns exist
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS referral_discount DECIMAL(10,2) DEFAULT 0;

ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS final_price DECIMAL(10,2) DEFAULT 0;

-- Step 3: Check current enrollments and their referral_code_id status
-- ============================================================================
SELECT 
    e.id as enrollment_id,
    e.participant_id,
    e.program_id,
    e.status as enrollment_status,
    e.referral_code_id,
    e.created_at,
    p.user_id,
    up.full_name as user_name,
    up.email as user_email
FROM enrollments e
LEFT JOIN participants p ON p.id = e.participant_id
LEFT JOIN user_profiles up ON up.id = p.user_id
ORDER BY e.created_at DESC
LIMIT 20;

-- Step 4: Check if there are any referral_tracking records we can use to populate enrollment
-- ============================================================================
SELECT 
    rt.id as tracking_id,
    rt.enrollment_id,
    rt.referral_code_id,
    rt.status as tracking_status,
    rt.participant_id,
    e.referral_code_id as enrollment_referral_code_id,
    CASE 
        WHEN e.referral_code_id IS NULL THEN 'NEEDS UPDATE'
        WHEN e.referral_code_id = rt.referral_code_id THEN 'OK'
        ELSE 'MISMATCH'
    END as status_check
FROM referral_tracking rt
JOIN enrollments e ON e.id = rt.enrollment_id
ORDER BY rt.created_at DESC
LIMIT 20;

-- Step 5: Update enrollments with referral_code_id from referral_tracking (if missing)
-- ============================================================================
-- Sync referral_code_id from referral_tracking to enrollments for existing records
UPDATE enrollments e
SET referral_code_id = rt.referral_code_id,
    updated_at = NOW()
FROM referral_tracking rt
WHERE e.id = rt.enrollment_id
AND e.referral_code_id IS NULL
AND rt.referral_code_id IS NOT NULL;

-- Show how many records were updated
SELECT 
    COUNT(*) as updated_count,
    'Enrollments updated with referral_code_id from referral_tracking' as message
FROM enrollments e
JOIN referral_tracking rt ON e.id = rt.enrollment_id
WHERE e.referral_code_id = rt.referral_code_id;

-- Step 6: Verify RLS policy allows reading referral_code_id
-- ============================================================================
-- Check current RLS policies on enrollments
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'enrollments'
AND cmd = 'SELECT'
ORDER BY policyname;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. If referral_code_id column doesn't exist, run Step 2
-- 2. Check Step 3 to see current enrollments status
-- 3. Check Step 4 to see if referral_tracking has data we can sync
-- 4. If needed, uncomment Step 5 to sync referral_code_id from referral_tracking
-- 5. Make sure RLS policy in Step 6 allows SELECT on referral_code_id column
