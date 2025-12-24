-- Detect Orphaned Users (Signed up but NO Enrollments)
-- This helps identify users who might have failed to redirect to the referral page after login.

SELECT 
    'ORPHANED_USER' as check_type,
    up.id,
    up.email,
    up.full_name,
    up.created_at,
    CASE 
        WHEN up.avatar_url ILIKE '%google%' THEN 'Google Auth'
        ELSE 'Email/Password' 
    END as auth_method,
    -- Check if they have a participant record (step 1 of registration)
    CASE WHEN p.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_participant_record
FROM user_profiles up
LEFT JOIN participants p ON p.user_id = up.id
LEFT JOIN enrollments e ON e.participant_id = p.id
WHERE 
    -- Only check users created in the last 7 days (or adjust as needed)
    up.created_at > NOW() - INTERVAL '7 days'
    -- AND they have NO enrollments
    AND e.id IS NULL
    -- Exclude admins/trainers if needed (optional, assuming 'user' role)
    AND up.role = 'user'
ORDER BY up.created_at DESC;
