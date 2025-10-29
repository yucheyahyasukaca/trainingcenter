-- ============================================================================
-- SYNC REFERRAL FROM TRACKING TO ENROLLMENTS
-- ============================================================================
-- Script untuk sync referral_code_id dari referral_tracking ke enrollments
-- dan membuat tracking jika belum ada tapi enrollment punya referral code di notes
-- ============================================================================

-- Step 1: Check all enrollments with null referral_code_id
-- ============================================================================
SELECT 
    'Enrollments with NULL referral_code_id' as check_type,
    COUNT(*) as count
FROM enrollments
WHERE referral_code_id IS NULL;

-- Step 2: Check if there are any referral_tracking records
-- ============================================================================
SELECT 
    'Total referral_tracking records' as check_type,
    COUNT(*) as count
FROM referral_tracking;

-- Step 3: Show enrollments that should have referral_code_id
-- ============================================================================
SELECT 
    e.id as enrollment_id,
    e.participant_id,
    e.program_id,
    e.status,
    e.referral_code_id as current_referral_code_id,
    e.notes,
    rt.id as tracking_id,
    rt.referral_code_id as tracking_referral_code_id,
    rt.status as tracking_status,
    CASE 
        WHEN e.referral_code_id IS NULL AND rt.referral_code_id IS NOT NULL THEN 'NEEDS UPDATE'
        WHEN e.referral_code_id = rt.referral_code_id THEN 'OK'
        WHEN e.referral_code_id IS NOT NULL AND rt.referral_code_id IS NULL THEN 'TRACKING MISSING'
        ELSE 'NO REFERRAL'
    END as action_needed
FROM enrollments e
LEFT JOIN referral_tracking rt ON e.id = rt.enrollment_id
ORDER BY e.created_at DESC
LIMIT 20;

-- Step 4: Update enrollments with referral_code_id from referral_tracking
-- ============================================================================
UPDATE enrollments e
SET 
    referral_code_id = rt.referral_code_id,
    updated_at = NOW()
FROM referral_tracking rt
WHERE e.id = rt.enrollment_id
AND e.referral_code_id IS NULL
AND rt.referral_code_id IS NOT NULL;

-- Show results
SELECT 
    'Enrollments updated from referral_tracking' as action,
    COUNT(*) as updated_count
FROM enrollments e
JOIN referral_tracking rt ON e.id = rt.enrollment_id
WHERE e.referral_code_id = rt.referral_code_id
AND e.updated_at > NOW() - INTERVAL '5 minutes';

-- Step 5: Check enrollments with referral code mentioned in notes but no referral_code_id
-- ============================================================================
SELECT 
    e.id as enrollment_id,
    e.participant_id,
    e.notes,
    e.referral_code_id
FROM enrollments e
WHERE e.notes ILIKE '%referral%' 
OR e.notes ILIKE '%kode referral%'
AND e.referral_code_id IS NULL
ORDER BY e.created_at DESC
LIMIT 10;

-- Step 6: Manual fix - if you know the enrollment_id and referral_code_id, run this:
UPDATE enrollments
SET referral_code_id = 'YOUR_REFERRAL_CODE_ID_HERE',
    updated_at = NOW()
WHERE id = 'YOUR_ENROLLMENT_ID_HERE';
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 
    'Final Status' as check_type,
    COUNT(*) FILTER (WHERE referral_code_id IS NOT NULL) as with_referral,
    COUNT(*) FILTER (WHERE referral_code_id IS NULL) as without_referral,
    COUNT(*) as total
FROM enrollments;

-- ============================================================================
-- COMPLETION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Sync completed! Check the results above.';
    RAISE NOTICE 'If enrollment still has null referral_code_id, you may need to:';
    RAISE NOTICE '1. Check if referral_tracking record exists for that enrollment';
    RAISE NOTICE '2. Or manually update enrollment with correct referral_code_id';
END $$;
