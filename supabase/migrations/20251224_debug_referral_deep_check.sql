-- Deep Debug Referral MQHSK1JZ

-- 1. Full Code Metadata
SELECT 
    'METADATA' as check_type,
    code,
    is_active,
    max_uses,
    current_uses,
    valid_until,
    created_at,
    (max_uses IS NULL OR current_uses < max_uses) as has_remaining_uses,
    (valid_until IS NULL OR valid_until > NOW()) as is_not_expired
FROM referral_codes 
WHERE code = 'MQHSK1JZ';

-- 2. Orphaned Enrollments Check
-- Check for enrollments that mention this code in notes but have NO referral_tracking entry
SELECT 
    'ORPHANED_ENROLLMENT' as check_type,
    e.id as enrollment_id,
    e.created_at,
    e.status,
    p.name as participant_name,
    p.email as participant_email,
    e.notes
FROM enrollments e
JOIN participants p ON p.id = e.participant_id
WHERE e.notes ILIKE '%MQHSK1JZ%'
AND NOT EXISTS (
    SELECT 1 FROM referral_tracking rt WHERE rt.enrollment_id = e.id
);

-- 3. Recent Signups (Potential Users)
-- List users created after the referral code was created, to see if we can spot the user
SELECT 
    'RECENT_USER' as check_type,
    up.id,
    up.email,
    up.full_name,
    up.created_at,
    (SELECT COUNT(*) FROM enrollments e WHERE e.participant_id IN (SELECT id FROM participants WHERE user_id = up.id)) as enrollment_count
FROM user_profiles up
WHERE up.created_at > (SELECT created_at FROM referral_codes WHERE code = 'MQHSK1JZ')
ORDER BY up.created_at DESC
LIMIT 10;
