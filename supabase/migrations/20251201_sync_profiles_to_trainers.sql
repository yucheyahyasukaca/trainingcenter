-- Sync trainers from user_profiles to trainers table
-- This is necessary because the points system relies on the trainers table, 
-- but some users are only in user_profiles.

INSERT INTO trainers (
    id, 
    name, 
    email, 
    created_at, 
    updated_at,
    specialization,
    experience_years,
    phone
)
SELECT 
    id, 
    full_name, 
    email, 
    COALESCE(created_at, NOW()), 
    COALESCE(updated_at, NOW()),
    'General', -- Default
    0,         -- Default
    '-'        -- Default
FROM user_profiles
WHERE role = 'trainer'
ON CONFLICT (id) DO NOTHING;
