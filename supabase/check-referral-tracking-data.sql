-- ============================================================================
-- CHECK REFERRAL TRACKING DATA
-- ============================================================================
-- Script untuk melihat data referral tracking yang ada di database
-- ============================================================================

-- Check if referral_tracking table exists and has data
SELECT 'Checking referral_tracking table...' as info;

SELECT COUNT(*) as total_referral_tracking
FROM referral_tracking;

-- Check referral tracking records with details
SELECT 
    rt.id,
    rt.trainer_id,
    rt.participant_id,
    rt.enrollment_id,
    rt.status as referral_status,
    rt.commission_earned,
    rt.discount_applied,
    rt.created_at,
    up.full_name as trainer_name,
    up.email as trainer_email,
    p.name as participant_name,
    p.email as participant_email,
    pr.title as program_title,
    e.status as enrollment_status
FROM referral_tracking rt
LEFT JOIN user_profiles up ON rt.trainer_id = up.id
LEFT JOIN participants p ON rt.participant_id = p.id
LEFT JOIN enrollments e ON rt.enrollment_id = e.id
LEFT JOIN programs pr ON rt.program_id = pr.id
ORDER BY rt.created_at DESC
LIMIT 20;

-- Check if enrollments have referral_code_id
SELECT 'Checking enrollments with referral_code_id...' as info;

SELECT COUNT(*) as enrollments_with_referral
FROM enrollments 
WHERE referral_code_id IS NOT NULL;

-- Check enrollments with referral details
SELECT 
    e.id as enrollment_id,
    e.referral_code_id,
    e.status as enrollment_status,
    e.payment_status,
    e.created_at,
    p.name as participant_name,
    pr.title as program_title,
    rc.code as referral_code
FROM enrollments e
LEFT JOIN participants p ON e.participant_id = p.id
LEFT JOIN programs pr ON e.program_id = pr.id
LEFT JOIN referral_codes rc ON e.referral_code_id = rc.id
WHERE e.referral_code_id IS NOT NULL
ORDER BY e.created_at DESC
LIMIT 20;

-- Summary
SELECT 
    'Summary' as type,
    (SELECT COUNT(*) FROM referral_tracking) as total_referral_tracking,
    (SELECT COUNT(*) FROM referral_tracking WHERE status = 'pending') as pending_referrals,
    (SELECT COUNT(*) FROM referral_tracking WHERE status = 'confirmed') as confirmed_referrals,
    (SELECT COUNT(*) FROM referral_tracking WHERE status = 'cancelled') as cancelled_referrals,
    (SELECT COUNT(*) FROM enrollments WHERE referral_code_id IS NOT NULL) as enrollments_with_referral;
