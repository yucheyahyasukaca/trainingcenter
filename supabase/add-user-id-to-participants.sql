-- Add user_id column to participants table to link with auth.users

-- Add user_id column to participants table
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);

-- Update existing participants to have user_id if they have matching email
-- This is a one-time migration for existing data
UPDATE participants 
SET user_id = (
  SELECT id FROM auth.users 
  WHERE auth.users.email = participants.email 
  LIMIT 1
)
WHERE user_id IS NULL;

-- Make user_id NOT NULL after migration (optional, uncomment if needed)
-- ALTER TABLE participants ALTER COLUMN user_id SET NOT NULL;

-- Update RLS policies to work with user_id
DROP POLICY IF EXISTS "Users can view their own participant record" ON participants;
DROP POLICY IF EXISTS "Users can insert their own participant record" ON participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON participants;
DROP POLICY IF EXISTS "Users can delete their own participant record" ON participants;
DROP POLICY IF EXISTS "Admins and managers can manage all participants" ON participants;

-- Create comprehensive RLS policies for participants with user_id

-- Policy for SELECT (view participants)
CREATE POLICY "Users can view their own participant record" ON participants
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Policy for INSERT (create participants)
CREATE POLICY "Users can insert their own participant record" ON participants
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Policy for UPDATE (update participants)
CREATE POLICY "Users can update their own participant record" ON participants
FOR UPDATE USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Policy for DELETE (delete participants)
CREATE POLICY "Users can delete their own participant record" ON participants
FOR DELETE USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Policy for admins and managers to manage all participants
CREATE POLICY "Admins and managers can manage all participants" ON participants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);
