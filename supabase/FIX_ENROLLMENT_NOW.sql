-- ============================================================================
-- IMMEDIATE FIX FOR ENROLLMENT ACCESS
-- Run this script in Supabase SQL Editor to fix the issue RIGHT NOW
-- ============================================================================

-- Step 1: Ensure user_id column exists in participants
ALTER TABLE participants ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Link all participants to their auth users
UPDATE participants p
SET user_id = au.id
FROM auth.users au
WHERE p.email = au.email AND p.user_id IS NULL;

-- Step 3: Create participant records for users who don't have one
INSERT INTO participants (user_id, name, email, status, created_at, updated_at)
SELECT 
    au.id,
    COALESCE(up.full_name, au.email),
    au.email,
    'active',
    NOW(),
    NOW()
FROM auth.users au
LEFT JOIN user_profiles up ON up.id = au.id
WHERE NOT EXISTS (
    SELECT 1 FROM participants p WHERE p.user_id = au.id
)
ON CONFLICT (email) DO NOTHING;

-- Step 4: Drop and recreate RLS policy for enrollments
DROP POLICY IF EXISTS "Users can view enrollments for their participant record" ON enrollments;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Enrollments are viewable by all authenticated users" ON enrollments;

CREATE POLICY "Users can view enrollments for their participant record" ON enrollments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM participants 
    WHERE participants.id = enrollments.participant_id 
    AND participants.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Step 5: Ensure classes RLS allows authenticated users
DROP POLICY IF EXISTS "Classes are viewable by all authenticated users" ON classes;
CREATE POLICY "Classes are viewable by all authenticated users" ON classes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_enrollments_participant_id ON enrollments(participant_id);

-- Step 7: Show results
SELECT 
    'User yucheyahya@gmail.com participant info:' as info,
    p.id,
    p.user_id,
    p.email,
    p.name,
    p.status
FROM participants p
WHERE p.email = 'yucheyahya@gmail.com';

SELECT 
    'User yucheyahya@gmail.com enrollments:' as info,
    e.id,
    e.program_id,
    e.status,
    e.payment_status
FROM enrollments e
JOIN participants p ON e.participant_id = p.id
WHERE p.email = 'yucheyahya@gmail.com';

-- Done! Now the user should be able to access their enrolled classes.
