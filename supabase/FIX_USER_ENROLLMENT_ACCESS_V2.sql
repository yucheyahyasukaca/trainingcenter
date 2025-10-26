-- ============================================================================
-- FIX USER ENROLLMENT ACCESS - V2 (Simplified and Robust)
-- This script ensures users can access their enrollments and classes
-- ============================================================================

-- Step 1: Add missing columns to participants table if they don't exist
-- ============================================================================

DO $$ 
BEGIN
    -- Add user_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'user_id') THEN
        ALTER TABLE participants ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'status') THEN
        ALTER TABLE participants ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'company') THEN
        ALTER TABLE participants ADD COLUMN company VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'position') THEN
        ALTER TABLE participants ADD COLUMN position VARCHAR(255);
    END IF;
END $$;

-- Step 2: Link participants with auth.users by email
-- ============================================================================

UPDATE participants p
SET user_id = au.id
FROM auth.users au
WHERE p.email = au.email AND p.user_id IS NULL;

-- Step 3: Create participant records for any users that don't have one
-- ============================================================================

INSERT INTO participants (user_id, name, email, phone, status, created_at, updated_at)
SELECT 
    au.id,
    COALESCE(up.full_name, au.email),
    au.email,
    COALESCE(up.phone, ''),
    'active',
    NOW(),
    NOW()
FROM auth.users au
LEFT JOIN user_profiles up ON up.id = au.id
WHERE NOT EXISTS (
    SELECT 1 FROM participants p WHERE p.user_id = au.id
);

-- Step 4: Fix RLS policies for enrollments
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Enrollments are viewable by all authenticated users" ON enrollments;
DROP POLICY IF EXISTS "Admins and managers can manage all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can view enrollments for their participant record" ON enrollments;

-- Create new policy that allows users to view enrollments through participant link
CREATE POLICY "Users can view enrollments for their participant record" ON enrollments
FOR SELECT USING (
  -- User can view if their user_id matches the participant's user_id
  EXISTS (
    SELECT 1 FROM participants 
    WHERE participants.id = enrollments.participant_id 
    AND participants.user_id = auth.uid()
  )
  OR
  -- Or if they're admin/manager
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Step 5: Ensure classes are viewable by all authenticated users
-- ============================================================================

DROP POLICY IF EXISTS "Classes are viewable by all authenticated users" ON classes;
CREATE POLICY "Classes are viewable by all authenticated users" ON classes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Step 6: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_enrollments_participant_id ON enrollments(participant_id);

-- Step 7: Output summary
-- ============================================================================

DO $$
DECLARE
  participant_count INTEGER;
  enrollment_count INTEGER;
  linked_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO participant_count FROM participants;
  SELECT COUNT(*) INTO enrollment_count FROM enrollments;
  SELECT COUNT(*) INTO linked_count FROM participants WHERE user_id IS NOT NULL;
  
  RAISE NOTICE 'Fix complete. Summary:';
  RAISE NOTICE '- Total participants: %', participant_count;
  RAISE NOTICE '- Participants linked to users: %', linked_count;
  RAISE NOTICE '- Total enrollments: %', enrollment_count;
END $$;
