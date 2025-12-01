-- Script to check referral stats consistency between referral_tracking and enrollments

-- 1. Check total count in referral_tracking
SELECT COUNT(*) as total_referral_tracking FROM referral_tracking;

-- 2. Check total count in enrollments with referral code
SELECT COUNT(*) as total_enrollments_with_code FROM enrollments WHERE referral_code_id IS NOT NULL;

-- 3. Compare counts per trainer (Top 10 differences)
WITH tracking_counts AS (
    SELECT trainer_id, COUNT(*) as count
    FROM referral_tracking
    GROUP BY trainer_id
),
enrollment_counts AS (
    SELECT rc.trainer_id, COUNT(*) as count
    FROM enrollments e
    JOIN referral_codes rc ON e.referral_code_id = rc.id
    GROUP BY rc.trainer_id
)
SELECT 
    COALESCE(tc.trainer_id, ec.trainer_id) as trainer_id,
    COALESCE(tc.count, 0) as tracking_count,
    COALESCE(ec.count, 0) as enrollment_count,
    COALESCE(tc.count, 0) - COALESCE(ec.count, 0) as diff
FROM tracking_counts tc
FULL OUTER JOIN enrollment_counts ec ON tc.trainer_id = ec.trainer_id
ORDER BY ABS(COALESCE(tc.count, 0) - COALESCE(ec.count, 0)) DESC
LIMIT 10;

-- 4. Check if we have trainers with 0 referrals in tracking but > 0 in enrollments
-- This would indicate missing tracking data
SELECT 
    rc.trainer_id, 
    COUNT(e.id) as enrollment_count
FROM enrollments e
JOIN referral_codes rc ON e.referral_code_id = rc.id
LEFT JOIN referral_tracking rt ON rt.enrollment_id = e.id
WHERE rt.id IS NULL
GROUP BY rc.trainer_id
LIMIT 10;
