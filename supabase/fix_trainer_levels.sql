-- Fix trainer levels in database
-- Jalankan di Supabase SQL Editor

-- Update trainer levels for existing users
UPDATE user_profiles 
SET trainer_level = CASE 
  WHEN role = 'admin' THEN 'master_trainer'
  WHEN role = 'manager' THEN 'trainer_l2'
  WHEN role = 'user' THEN 'trainer'
  ELSE 'user'
END
WHERE trainer_level IS NULL OR trainer_level = 'user';

-- Add trainer experience years for existing users
UPDATE user_profiles 
SET trainer_experience_years = CASE 
  WHEN role = 'admin' THEN 10
  WHEN role = 'manager' THEN 5
  WHEN role = 'user' THEN 2
  ELSE 0
END
WHERE trainer_experience_years IS NULL OR trainer_experience_years = 0;

-- Add trainer specializations
UPDATE user_profiles 
SET trainer_specializations = CASE 
  WHEN role = 'admin' THEN ARRAY['Leadership', 'Management', 'Technology', 'Marketing']
  WHEN role = 'manager' THEN ARRAY['Management', 'Leadership']
  WHEN role = 'user' THEN ARRAY['General Training']
  ELSE ARRAY[]::TEXT[]
END
WHERE trainer_specializations IS NULL;

-- Verify the updates
SELECT 
  email, 
  full_name,
  role, 
  trainer_level, 
  trainer_experience_years,
  trainer_specializations
FROM user_profiles 
ORDER BY role DESC, full_name;
