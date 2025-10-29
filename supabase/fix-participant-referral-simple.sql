-- ============================================================================
-- FIX PARTICIPANT REFERRAL - SIMPLE VERSION
-- ============================================================================
-- Ganti participant_id di bawah dengan participant_id dari console log:
-- a1b0b3a7-c7fa-40c5-9379-f3704d243543
-- ============================================================================

-- GANTI INI dengan participant_id dari console log
DO $$
DECLARE
    v_participant_id UUID := 'a1b0b3a7-c7fa-40c5-9379-f3704d243543'; -- GANTI INI
BEGIN
    RAISE NOTICE 'Checking participant_id: %', v_participant_id;
END $$;

-- Step 1: Check referral_tracking for this participant
-- ============================================================================
SELECT 
    'Step 1: Referral Tracking' as step,
    rt.id as tracking_id,
    rt.referral_code_id,
    rt.enrollment_id,
    rt.status,
    rt.created_at,
    rc.code as referral_code_text
FROM referral_tracking rt
LEFT JOIN referral_codes rc ON rc.id = rt.referral_code_id
WHERE rt.participant_id = 'a1b0b3a7-c7fa-40c5-9379-f3704d243543'  -- GANTI INI
ORDER BY rt.created_at DESC;

-- Step 2: Check enrollments for this participant
-- ============================================================================
SELECT 
    'Step 2: Enrollments' as step,
    e.id as enrollment_id,
    e.program_id,
    e.status,
    e.referral_code_id,
    e.notes,
    e.created_at
FROM enrollments e
WHERE e.participant_id = 'a1b0b3a7-c7fa-40c5-9379-f3704d243543'  -- GANTI INI
ORDER BY e.created_at DESC;

-- Step 3: Update enrollment with referral_code_id from referral_tracking
-- ============================================================================
UPDATE enrollments e
SET 
    referral_code_id = rt.referral_code_id,
    updated_at = NOW()
FROM referral_tracking rt
WHERE e.id = rt.enrollment_id
AND e.participant_id = 'a1b0b3a7-c7fa-40c5-9379-f3704d243543'  -- GANTI INI
AND e.referral_code_id IS NULL
AND rt.referral_code_id IS NOT NULL;

-- Step 4: Verify update
-- ============================================================================
SELECT 
    'Step 4: Verification' as step,
    e.id as enrollment_id,
    e.referral_code_id,
    rt.referral_code_id as tracking_referral_code_id,
    CASE 
        WHEN e.referral_code_id IS NOT NULL THEN 'FIXED'
        WHEN rt.referral_code_id IS NOT NULL THEN 'STILL NEEDS FIX'
        ELSE 'NO REFERRAL DATA'
    END as status
FROM enrollments e
LEFT JOIN referral_tracking rt ON e.id = rt.enrollment_id
WHERE e.participant_id = 'a1b0b3a7-c7fa-40c5-9379-f3704d243543'  -- GANTI INI
ORDER BY e.created_at DESC;

-- ============================================================================
-- MANUAL UPDATE (jika masih null)
-- ============================================================================
-- Jika setelah di-run masih null, dan Anda tahu referral_code_id, jalankan:
-- 
-- UPDATE enrollments
-- SET referral_code_id = 'REFERRAL_CODE_ID_DI_SINI',
--     updated_at = NOW()
-- WHERE id = 'ENROLLMENT_ID_DI_SINI'
-- AND participant_id = 'a1b0b3a7-c7fa-40c5-9379-f3704d243543';
