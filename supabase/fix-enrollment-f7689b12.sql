-- ============================================================================
-- FIX ENROLLMENT: ADD REFERRAL CODE
-- ============================================================================
-- Enrollment ID: f7689b12-5d0d-4902-b25a-7b7db882daef
-- Referral Code ID: 6e703180-28f9-48e5-b3ec-70c56e27519b
-- Referral Code: 4KF4JM2R
-- Trainer ID: d0954ef1-30c7-4360-be95-7207988c4b5a
-- ============================================================================

-- STEP 1: Verifikasi referral code
-- ============================================================================
SELECT 
    'Verification' as step,
    rc.id as referral_code_id,
    rc.code as referral_code_text,
    rc.trainer_id,
    up.full_name as trainer_name,
    rc.is_active,
    rc.current_uses,
    rc.max_uses
FROM referral_codes rc
LEFT JOIN user_profiles up ON up.id = rc.trainer_id
WHERE rc.id = '6e703180-28f9-48e5-b3ec-70c56e27519b';

-- STEP 2: Lihat enrollment saat ini
-- ============================================================================
SELECT 
    'Current Enrollment' as step,
    e.id as enrollment_id,
    e.participant_id,
    e.program_id,
    e.status,
    e.referral_code_id,
    e.notes,
    e.created_at
FROM enrollments e
WHERE e.id = 'f7689b12-5d0d-4902-b25a-7b7db882daef';

-- STEP 3: Update enrollment dengan referral_code_id
-- ============================================================================
UPDATE enrollments
SET 
    referral_code_id = '6e703180-28f9-48e5-b3ec-70c56e27519b',
    updated_at = NOW()
WHERE id = 'f7689b12-5d0d-4902-b25a-7b7db882daef'
RETURNING id, referral_code_id, updated_at;

-- STEP 4: Buat referral_tracking record
-- ============================================================================
INSERT INTO referral_tracking (
    referral_code_id,
    trainer_id,
    participant_id,
    enrollment_id,
    program_id,
    status,
    discount_applied,
    commission_earned
)
SELECT 
    e.referral_code_id,
    rc.trainer_id,
    e.participant_id,
    e.id,
    e.program_id,
    CASE 
        WHEN e.status = 'approved' THEN 'confirmed'
        ELSE 'pending'
    END as status,
    COALESCE(e.referral_discount, 0) as discount_applied,
    0 as commission_earned
FROM enrollments e
JOIN referral_codes rc ON rc.id = e.referral_code_id
WHERE e.id = 'f7689b12-5d0d-4902-b25a-7b7db882daef'
AND e.referral_code_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM referral_tracking rt 
    WHERE rt.enrollment_id = e.id
)
RETURNING id, enrollment_id, referral_code_id, status, participant_id;

-- STEP 5: Verifikasi hasil akhir
-- ============================================================================
SELECT 
    'Final Verification' as step,
    e.id as enrollment_id,
    e.referral_code_id,
    rc.code as referral_code_text,
    rt.id as tracking_id,
    rt.status as tracking_status,
    rt.participant_id,
    CASE 
        WHEN e.referral_code_id IS NOT NULL AND rt.id IS NOT NULL THEN '✅ COMPLETE'
        WHEN e.referral_code_id IS NOT NULL AND rt.id IS NULL THEN '⚠️ NEEDS TRACKING'
        ELSE '❌ NEEDS FIX'
    END as status
FROM enrollments e
LEFT JOIN referral_codes rc ON rc.id = e.referral_code_id
LEFT JOIN referral_tracking rt ON rt.enrollment_id = e.id
WHERE e.id = 'f7689b12-5d0d-4902-b25a-7b7db882daef';
