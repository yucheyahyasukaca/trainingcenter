-- ============================================================================
-- DEBUG REFERRAL TRACKING ISSUE
-- ============================================================================
-- Script untuk melihat data referral tracking dan mencocokkan dengan user_profiles
-- ============================================================================

-- 1. Check referral_tracking data
SELECT '=== REFERRAL TRACKING DATA ===' as info;
SELECT 
    rt.id,
    rt.trainer_id,
    rt.status,
    rt.commission_earned,
    rt.participant_id,
    rt.enrollment_id,
    rt.created_at
FROM referral_tracking rt
ORDER BY rt.created_at DESC;

-- 2. Check user_profiles yang ada
SELECT '=== USER PROFILES ===' as info;
SELECT 
    up.id,
    up.full_name,
    up.email,
    up.role
FROM user_profiles up
ORDER BY up.created_at DESC;

-- 3. Match referral_tracking trainer_id dengan user_profiles
SELECT '=== MATCHING REFERRAL TRACKING WITH USER_PROFILES ===' as info;
SELECT 
    rt.trainer_id as tracking_trainer_id,
    up.id as profile_id,
    up.full_name,
    up.email,
    up.role,
    COUNT(rt.id) as tracking_count,
    SUM(CASE WHEN rt.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_count,
    SUM(rt.commission_earned) as total_commission
FROM referral_tracking rt
LEFT JOIN user_profiles up ON rt.trainer_id = up.id
GROUP BY rt.trainer_id, up.id, up.full_name, up.email, up.role
ORDER BY tracking_count DESC;

-- 4. Check if there's a mismatch in trainer_id
SELECT '=== CHECK FOR MISMATCH ===' as info;
SELECT 
    rt.trainer_id,
    COUNT(*) as tracking_count
FROM referral_tracking rt
LEFT JOIN user_profiles up ON rt.trainer_id = up.id
WHERE up.id IS NULL
GROUP BY rt.trainer_id;

-- 5. Summary
SELECT '=== SUMMARY ===' as info;
SELECT 
    (SELECT COUNT(*) FROM referral_tracking) as total_tracking,
    (SELECT COUNT(*) FROM referral_tracking WHERE status = 'confirmed') as confirmed_tracking,
    (SELECT COUNT(DISTINCT trainer_id) FROM referral_tracking) as unique_trainers_in_tracking,
    (SELECT COUNT(*) FROM referral_codes) as total_referral_codes,
    (SELECT COUNT(DISTINCT trainer_id) FROM referral_codes) as unique_trainers_with_codes,
    (SELECT COUNT(*) FROM user_profiles) as total_users,
    (SELECT COUNT(*) FROM user_profiles WHERE role = 'trainer') as total_trainers;
