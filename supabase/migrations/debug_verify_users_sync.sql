-- Verification script to check if all auth users have profiles
-- Created: 2025-12-24

WITH missing_profiles AS (
    SELECT au.id, au.email 
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.id
    WHERE up.id IS NULL
),
missing_participants AS (
    SELECT up.id, up.email
    FROM public.user_profiles up
    LEFT JOIN public.participants p ON up.id = p.user_id
    WHERE up.role = 'user' AND p.id IS NULL
)
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM public.user_profiles) as total_profiles,
    (SELECT COUNT(*) FROM missing_profiles) as missing_profiles_count,
    (SELECT COUNT(*) FROM missing_participants) as missing_participants_count,
    (SELECT json_agg(missing_profiles) FROM missing_profiles) as missing_profiles_details,
    (SELECT json_agg(missing_participants) FROM missing_participants) as missing_participants_details;
