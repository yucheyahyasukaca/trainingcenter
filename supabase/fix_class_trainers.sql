-- Fix class_trainers table to connect trainer with classes
-- Jalankan di Supabase SQL Editor

-- First, check if trainer@garuda-21.com exists
SELECT id, email, full_name, role, trainer_level 
FROM user_profiles 
WHERE email = 'trainer@garuda-21.com';

-- Check existing classes
SELECT 
  c.id,
  c.name,
  c.status,
  c.trainer_id,
  c.created_by,
  u.email as trainer_email
FROM classes c
LEFT JOIN user_profiles u ON c.trainer_id = u.id
ORDER BY c.created_at DESC;

-- Check existing class_trainers
SELECT 
  ct.*,
  c.name as class_name,
  u.email as trainer_email
FROM class_trainers ct
LEFT JOIN classes c ON ct.class_id = c.id
LEFT JOIN user_profiles u ON ct.trainer_id = u.id;

-- Insert missing class_trainers records
-- This connects the trainer with their classes
INSERT INTO class_trainers (class_id, trainer_id, role, is_primary, assigned_date)
SELECT 
  c.id as class_id,
  u.id as trainer_id,
  'instructor' as role,
  true as is_primary,
  NOW() as assigned_date
FROM classes c
CROSS JOIN user_profiles u
WHERE u.email = 'trainer@garuda-21.com'
  AND c.trainer_id = u.id
  AND NOT EXISTS (
    SELECT 1 FROM class_trainers ct 
    WHERE ct.class_id = c.id AND ct.trainer_id = u.id
  );

-- Verify the connections were created
SELECT 
  ct.*,
  c.name as class_name,
  c.status,
  u.email as trainer_email
FROM class_trainers ct
JOIN classes c ON ct.class_id = c.id
JOIN user_profiles u ON ct.trainer_id = u.id
WHERE u.email = 'trainer@garuda-21.com'
ORDER BY c.created_at DESC;
