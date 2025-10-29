-- ============================================================================
-- FIND AND FIX PARTICIPANT REFERRAL CODE
-- ============================================================================
-- Script untuk mencari dan memperbaiki referral code untuk participant tertentu
-- Gunakan participant_id dari console log: a1b0b3a7-c7fa-40c5-9379-f3704d243543
-- ============================================================================

-- Set participant_id yang akan di-check (ganti dengan participant_id dari console log)
\set participant_id 'a1b0b3a7-c7fa-40c5-9379-f3704d243543'

-- Step 1: Check all referral_tracking for this participant (by participant_id, not enrollment_id)
-- ============================================================================
SELECT 
    'Referral tracking for participant' as check_type,
    rt.id as tracking_id,
    rt.referral_code_id,
    rt.enrollment_id,
    rt.status,
    rt.created_at,
    rc.code as referral_code,
    e.id as enrollment_id_verify,
    e.referral_code_id as enrollment_referral_code_id
FROM referral_tracking rt
LEFT JOIN referral_codes rc ON rc.id = rt.referral_code_id
LEFT JOIN enrollments e ON e.id = rt.enrollment_id
WHERE rt.participant_id = :'participant_id'::uuid
ORDER BY rt.created_at DESC;

-- Step 2: Check all enrollments for this participant
-- ============================================================================
SELECT 
    'Enrollments for participant' as check_type,
    e.id as enrollment_id,
    e.program_id,
    e.status,
    e.referral_code_id,
    e.notes,
    e.created_at
FROM enrollments e
WHERE e.participant_id = :'participant_id'::uuid
ORDER BY e.created_at DESC;

-- Step 3: If there's referral_tracking but enrollment doesn't have referral_code_id, update it
-- ============================================================================
UPDATE enrollments e
SET 
    referral_code_id = rt.referral_code_id,
    updated_at = NOW()
FROM referral_tracking rt
WHERE e.id = rt.enrollment_id
AND e.participant_id = :'participant_id'::uuid
AND e.referral_code_id IS NULL
AND rt.referral_code_id IS NOT NULL;

-- Show how many were updated
SELECT 
    'Enrollments updated' as action,
    COUNT(*) as count
FROM enrollments e
JOIN referral_tracking rt ON e.id = rt.enrollment_id
WHERE e.participant_id = :'participant_id'::uuid
AND e.referral_code_id = rt.referral_code_id
AND e.updated_at > NOW() - INTERVAL '5 minutes';

-- Step 4: If there's NO referral_tracking but enrollment notes mention referral, check manually
-- ============================================================================
SELECT 
    'Enrollments with referral in notes but no tracking' as check_type,
    e.id as enrollment_id,
    e.notes,
    e.referral_code_id,
    e.created_at
FROM enrollments e
WHERE e.participant_id = :'participant_id'::uuid
AND (e.notes ILIKE '%referral%' OR e.notes ILIKE '%kode referral%')
AND e.referral_code_id IS NULL
ORDER BY e.created_at DESC;

-- Step 5: Check if participant has any referral codes they created (as trainer)
-- ============================================================================
SELECT 
    'Referral codes created by participant (as trainer)' as check_type,
    rc.id as referral_code_id,
    rc.code,
    rc.trainer_id,
    rc.is_active,
    rc.current_uses,
    rc.created_at
FROM referral_codes rc
JOIN participants p ON p.user_id = rc.trainer_id
WHERE p.id = :'participant_id'::uuid
ORDER BY rc.created_at DESC;

-- Step 6: Summary
-- ============================================================================
SELECT 
    'SUMMARY for participant' as summary_type,
    (SELECT COUNT(*) FROM referral_tracking WHERE participant_id = :'participant_id'::uuid) as tracking_count,
    (SELECT COUNT(*) FROM enrollments WHERE participant_id = :'participant_id'::uuid) as enrollment_count,
    (SELECT COUNT(*) FROM enrollments WHERE participant_id = :'participant_id'::uuid AND referral_code_id IS NOT NULL) as enrollments_with_referral,
    (SELECT COUNT(*) FROM referral_tracking WHERE participant_id = :'participant_id'::uuid AND status = 'confirmed') as confirmed_referrals;

-- ============================================================================
-- MANUAL FIX (if needed)
-- ============================================================================
-- If you found referral_tracking but enrollment doesn't have it, you can manually update:
-- UPDATE enrollments
-- SET referral_code_id = (SELECT referral_code_id FROM referral_tracking WHERE enrollment_id = 'YOUR_ENROLLMENT_ID' LIMIT 1),
--     updated_at = NOW()
-- WHERE id = 'YOUR_ENROLLMENT_ID';

-- Or if you know the referral_code_id directly:
-- UPDATE enrollments
-- SET referral_code_id = 'YOUR_REFERRAL_CODE_ID',
--     updated_at = NOW()
-- WHERE id = 'YOUR_ENROLLMENT_ID'
-- AND participant_id = :'participant_id'::uuid;
