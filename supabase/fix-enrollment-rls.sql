-- Fix RLS policies for enrollments table

-- Enable RLS on enrollments table
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins and managers can manage all enrollments" ON enrollments;

-- Create comprehensive RLS policies for enrollments

-- Policy for SELECT (view enrollments)
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

-- Policy for INSERT (create enrollments)
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

-- Policy for UPDATE (update enrollments)
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

-- Policy for DELETE (delete enrollments)
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

-- Policy for admins and managers to manage all enrollments
CREATE POLICY "Admins and managers can manage all enrollments" ON enrollments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Ensure user_profiles table has the correct structure
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Update any existing users without role
UPDATE user_profiles 
SET role = 'user' 
WHERE role IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_enrollments_participant_id ON enrollments(participant_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_program_id ON enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
