-- =====================================================
-- FIX CLASS_TRAINERS STRUCTURE
-- =====================================================
-- Script untuk memastikan class_trainers menggunakan user_id langsung
-- =====================================================

-- 1. CHECK CURRENT STRUCTURE
-- =====================================================

-- Check if class_trainers exists and its structure
SELECT 
  'Current class_trainers structure' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'class_trainers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. CHECK FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Check foreign key constraints
SELECT 
  'Foreign key constraints' as info,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'class_trainers'
AND tc.table_schema = 'public';

-- 3. CHECK IF TRAINER_ID REFERENCES USER_PROFILES.ID
-- =====================================================

-- Check if trainer_id references user_profiles.id
SELECT 
  'Checking trainer_id reference' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'class_trainers'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'trainer_id'
      AND ccu.table_name = 'user_profiles'
      AND ccu.column_name = 'id'
    ) THEN 'trainer_id references user_profiles.id ✓'
    ELSE 'trainer_id does NOT reference user_profiles.id ✗'
  END as status;

-- 4. IF NEEDED, DROP AND RECREATE FOREIGN KEY
-- =====================================================

-- Drop existing foreign key if it references trainers table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'class_trainers'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'trainer_id'
    AND ccu.table_name = 'trainers'
  ) THEN
    -- Drop the constraint
    ALTER TABLE class_trainers DROP CONSTRAINT IF EXISTS class_trainers_trainer_id_fkey;
    
    -- Add new constraint to reference user_profiles
    ALTER TABLE class_trainers 
    ADD CONSTRAINT class_trainers_trainer_id_fkey 
    FOREIGN KEY (trainer_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key constraint updated to reference user_profiles.id';
  ELSE
    RAISE NOTICE 'Foreign key constraint already references user_profiles.id or does not exist';
  END IF;
END $$;

-- 5. VERIFY FINAL STRUCTURE
-- =====================================================

-- Final verification
SELECT 
  'Final verification' as info,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'class_trainers'
AND tc.table_schema = 'public';
