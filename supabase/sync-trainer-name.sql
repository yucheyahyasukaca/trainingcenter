-- ============================================================================
-- SYNC TRAINER NAMES FROM USER_PROFILES TO TRAINERS TABLE
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================

-- Update trainers.name to match user_profiles.full_name
UPDATE trainers t
SET name = up.full_name
FROM user_profiles up
WHERE t.email = up.email
  AND t.name != up.full_name;

-- Also sync avatar_url
UPDATE trainers t
SET avatar_url = up.avatar_url
FROM user_profiles up
WHERE t.email = up.email
  AND t.avatar_url IS NULL
  AND up.avatar_url IS NOT NULL;

-- Verify the sync
SELECT 
  t.id,
  t.name as trainer_name,
  t.email,
  up.full_name as profile_name,
  t.avatar_url,
  up.avatar_url as profile_avatar
FROM trainers t
LEFT JOIN user_profiles up ON t.email = up.email
ORDER BY t.created_at DESC;
