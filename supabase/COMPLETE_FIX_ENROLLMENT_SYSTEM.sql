-- ============================================================================
-- COMPLETE FIX FOR ENROLLMENT SYSTEM
-- Jalankan SQL ini di Supabase SQL Editor untuk memperbaiki semua masalah RLS
-- ============================================================================

-- Step 1: Add user_id column to participants table
-- ============================================================================
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);

-- Update existing participants to have user_id if they have matching email
UPDATE participants 
SET user_id = (
  SELECT id FROM auth.users 
  WHERE auth.users.email = participants.email 
  LIMIT 1
)
WHERE user_id IS NULL;

-- Step 2: Fix RLS policies for participants table
-- ============================================================================
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON participants;
DROP POLICY IF EXISTS "Enable insert for all users" ON participants;
DROP POLICY IF EXISTS "Enable update for all users" ON participants;
DROP POLICY IF EXISTS "Enable delete for all users" ON participants;
DROP POLICY IF EXISTS "Users can view their own participant record" ON participants;
DROP POLICY IF EXISTS "Users can insert their own participant record" ON participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON participants;
DROP POLICY IF EXISTS "Users can delete their own participant record" ON participants;
DROP POLICY IF EXISTS "Admins and managers can manage all participants" ON participants;

-- Create new RLS policies for participants
CREATE POLICY "Users can view their own participant record" ON participants
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Users can insert their own participant record" ON participants
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participant record" ON participants
FOR UPDATE USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Users can delete their own participant record" ON participants
FOR DELETE USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins and managers can manage all participants" ON participants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Step 3: Add columns to enrollments table
-- ============================================================================
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 4: Fix RLS policies for enrollments table
-- ============================================================================
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON enrollments;
DROP POLICY IF EXISTS "Enable insert for all users" ON enrollments;
DROP POLICY IF EXISTS "Enable update for all users" ON enrollments;
DROP POLICY IF EXISTS "Enable delete for all users" ON enrollments;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can delete their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins and managers can manage all enrollments" ON enrollments;

-- Create new RLS policies for enrollments
CREATE POLICY "Users can view their own enrollments" ON enrollments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM participants 
    WHERE participants.id = enrollments.participant_id 
    AND participants.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Users can insert their own enrollments" ON enrollments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM participants 
    WHERE participants.id = enrollments.participant_id 
    AND participants.user_id = auth.uid()
  ) AND
  EXISTS (
    SELECT 1 FROM programs 
    WHERE programs.id = enrollments.program_id 
    AND programs.status = 'published'
  )
);

CREATE POLICY "Users can update their own enrollments" ON enrollments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM participants 
    WHERE participants.id = enrollments.participant_id 
    AND participants.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Users can delete their own enrollments" ON enrollments
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM participants 
    WHERE participants.id = enrollments.participant_id 
    AND participants.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins and managers can manage all enrollments" ON enrollments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Step 5: Add whatsapp_group_url to programs table
-- ============================================================================
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT;

-- Step 6: Create indexes for better performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_enrollments_participant_id ON enrollments(participant_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_program_id ON enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Step 7: Ensure user_profiles has role column
-- ============================================================================
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Update any existing users without role
UPDATE user_profiles 
SET role = 'user' 
WHERE role IS NULL;

-- ============================================================================
-- DONE! Enrollment system RLS policies are now properly configured
-- ============================================================================
