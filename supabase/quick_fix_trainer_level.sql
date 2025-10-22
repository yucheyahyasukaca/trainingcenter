-- Quick fix trainer levels
-- Jalankan di Supabase SQL Editor

-- Update trainer levels based on role (using new level system)
UPDATE user_profiles 
SET 
  trainer_level = CASE 
    WHEN role = 'admin' THEN 'master'
    WHEN role = 'manager' THEN 'expert'
    WHEN role = 'trainer' THEN 'junior'
    ELSE 'user'
  END,
  trainer_experience_years = CASE 
    WHEN role = 'admin' THEN 10
    WHEN role = 'manager' THEN 5
    WHEN role = 'trainer' THEN 2
    ELSE 0
  END,
  trainer_specializations = CASE 
    WHEN role = 'admin' THEN ARRAY['Leadership', 'Management', 'Technology']
    WHEN role = 'manager' THEN ARRAY['Management', 'Leadership']
    WHEN role = 'trainer' THEN ARRAY['General Training']
    ELSE ARRAY[]::TEXT[]
  END;

-- Check results
SELECT email, full_name, role, trainer_level, trainer_experience_years 
FROM user_profiles 
WHERE email LIKE '%garuda21.com' OR role IN ('admin', 'manager', 'trainer', 'user')
ORDER BY role DESC;
