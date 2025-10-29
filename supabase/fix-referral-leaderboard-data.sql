-- ============================================================================
-- FIX REFERRAL LEADERBOARD DATA
-- ============================================================================
-- Script untuk memperbaiki data referral di leaderboard
-- Masalah: API menggunakan trainer_id dari user_profiles tapi data tracking tidak cocok
-- ============================================================================

-- Check detailed referral tracking data
SELECT 
    'Referral Tracking Details' as section,
    rt.id,
    rt.trainer_id as tracking_trainer_id,
    rt.participant_id,
    rt.enrollment_id,
    rt.status,
    rt.commission_earned,
    rt.discount_applied,
    up.full_name as trainer_name,
    up.email as trainer_email,
    up.role as trainer_role
FROM referral_tracking rt
LEFT JOIN user_profiles up ON rt.trainer_id = up.id
ORDER BY rt.created_at DESC;

-- Check referral codes and their trainers
SELECT 
    'Referral Codes Details' as section,
    rc.id,
    rc.code,
    rc.trainer_id as code_trainer_id,
    up.full_name as trainer_name,
    up.email as trainer_email,
    up.role as trainer_role,
    rc.is_active
FROM referral_codes rc
LEFT JOIN user_profiles up ON rc.trainer_id = up.id
ORDER BY rc.created_at DESC;

-- Check user_profiles with role = 'trainer'
SELECT 
    'Trainers in user_profiles' as section,
    up.id,
    up.full_name,
    up.email,
    up.role,
    COUNT(rc.id) as total_referral_codes,
    COUNT(rt.id) as total_referral_tracking
FROM user_profiles up
LEFT JOIN referral_codes rc ON up.id = rc.trainer_id
LEFT JOIN referral_tracking rt ON up.id = rt.trainer_id
WHERE up.role = 'trainer' OR up.id IN (
    SELECT DISTINCT trainer_id FROM referral_tracking
)
GROUP BY up.id, up.full_name, up.email, up.role
ORDER BY total_referral_tracking DESC;

-- Check all users (not just trainers) who have referral codes
SELECT 
    'Users with referral codes' as section,
    up.id,
    up.full_name,
    up.email,
    up.role,
    COUNT(rc.id) as total_referral_codes,
    COUNT(rt.id) as total_referral_tracking
FROM user_profiles up
LEFT JOIN referral_codes rc ON up.id = rc.trainer_id
LEFT JOIN referral_tracking rt ON up.id = rt.trainer_id
WHERE EXISTS (
    SELECT 1 FROM referral_codes rc2 WHERE rc2.trainer_id = up.id
)
GROUP BY up.id, up.full_name, up.email, up.role
ORDER BY total_referral_tracking DESC;

-- Summary of the issue
SELECT 
    'Issue Analysis' as analysis,
    (SELECT COUNT(*) FROM referral_tracking) as total_tracking_records,
    (SELECT COUNT(DISTINCT trainer_id) FROM referral_tracking) as unique_trainers_in_tracking,
    (SELECT COUNT(*) FROM user_profiles WHERE role = 'trainer') as trainers_in_user_profiles,
    (SELECT COUNT(*) FROM referral_codes) as total_referral_codes,
    (SELECT COUNT(DISTINCT trainer_id) FROM referral_codes) as unique_trainers_with_codes;
