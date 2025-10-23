-- Check trainer classes connection
-- Jalankan di Supabase SQL Editor

-- 1. Check if trainer@garuda-21.com exists
SELECT 
  'User Profile' as table_name,
  id, 
  email, 
  full_name, 
  role, 
  trainer_level 
FROM user_profiles 
WHERE email = 'trainer@garuda-21.com';

-- 2. Check existing classes
SELECT 
  'Classes' as table_name,
  c.id,
  c.name,
  c.status,
  c.trainer_id,
  c.created_by,
  u.email as trainer_email
FROM classes c
LEFT JOIN user_profiles u ON c.trainer_id = u.id
ORDER BY c.created_at DESC;

-- 3. Check class_trainers connections
SELECT 
  'Class Trainers' as table_name,
  ct.class_id,
  ct.trainer_id,
  ct.role,
  ct.is_primary,
  c.name as class_name,
  c.status as class_status,
  u.email as trainer_email
FROM class_trainers ct
LEFT JOIN classes c ON ct.class_id = c.id
LEFT JOIN user_profiles u ON ct.trainer_id = u.id
WHERE u.email = 'trainer@garuda-21.com'
ORDER BY c.created_at DESC;

-- 4. Check if there are any classes without class_trainers connection
SELECT 
  'Missing Connections' as table_name,
  c.id as class_id,
  c.name as class_name,
  c.status,
  c.trainer_id,
  u.email as trainer_email
FROM classes c
JOIN user_profiles u ON c.trainer_id = u.id
WHERE u.email = 'trainer@garuda-21.com'
  AND NOT EXISTS (
    SELECT 1 FROM class_trainers ct 
    WHERE ct.class_id = c.id AND ct.trainer_id = u.id
  );

-- 5. Create missing connections if any
INSERT INTO class_trainers (class_id, trainer_id, role, is_primary, assigned_date)
SELECT 
  c.id as class_id,
  u.id as trainer_id,
  'instructor' as role,
  true as is_primary,
  NOW() as assigned_date
FROM classes c
JOIN user_profiles u ON c.trainer_id = u.id
WHERE u.email = 'trainer@garuda-21.com'
  AND NOT EXISTS (
    SELECT 1 FROM class_trainers ct 
    WHERE ct.class_id = c.id AND ct.trainer_id = u.id
  );

-- 6. Final verification - all connections
SELECT 
  'Final Verification' as table_name,
  ct.class_id,
  ct.trainer_id,
  ct.role,
  c.name as class_name,
  c.status as class_status,
  c.current_participants,
  c.max_participants,
  u.email as trainer_email
FROM class_trainers ct
JOIN classes c ON ct.class_id = c.id
JOIN user_profiles u ON ct.trainer_id = u.id
WHERE u.email = 'trainer@garuda-21.com'
ORDER BY c.created_at DESC;

