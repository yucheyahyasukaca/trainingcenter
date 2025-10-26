-- ============================================================================
-- FIX USER ENROLLMENT ACCESS
-- This script ensures users can access their enrollments and classes
-- ============================================================================

-- Step 0: Ensure participants table has required columns
-- ============================================================================

-- Check if user_id column already exists, if not add it
DO $$ 
BEGIN
    -- Check and add user_id column
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

-- Step 1: Ensure all users have participant records
-- ============================================================================

-- Insert participant record for any auth.users that don't have one
-- Use DEFAULT for id to let PostgreSQL generate it
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

-- Step 2: Update existing participants to link with auth.users
-- ============================================================================

-- Update participants with matching email but no user_id
UPDATE participants p
SET user_id = au.id
FROM auth.users au
WHERE p.email = au.email AND p.user_id IS NULL;

-- Step 3: Fix RLS policies to be more permissive for enrollment access
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Enrollments are viewable by all authenticated users" ON enrollments;
DROP POLICY IF EXISTS "Admins and managers can manage all enrollments" ON enrollments;

-- Create policy that allows users to view enrollments through participant link OR directly by user_id
-- We'll also allow viewing by enrollment participant matching current user's participant record
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

-- Allow all authenticated users to view classes (they'll be filtered by enrollment)
CREATE POLICY "Classes are viewable by all authenticated users" ON classes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Step 4: Create helper view for user enrollments
-- ============================================================================

CREATE OR REPLACE VIEW user_enrollments AS
SELECT 
  e.*,
  p.user_id,
  pr.title as program_title,
  pr.status as program_status,
  c.name as class_name
FROM enrollments e
JOIN participants p ON e.participant_id = p.id
JOIN programs pr ON e.program_id = pr.id
LEFT JOIN classes c ON e.class_id = c.id;

-- Grant access to the view
GRANT SELECT ON user_enrollments TO authenticated;

-- Step 5: Add function to get user's active enrollments
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_enrollments(p_user_id UUID)
RETURNS TABLE (
  enrollment_id UUID,
  program_id UUID,
  program_title TEXT,
  class_id UUID,
  class_name TEXT,
  status TEXT,
  payment_status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as enrollment_id,
    e.program_id,
    pr.title as program_title,
    e.class_id,
    c.name as class_name,
    e.status,
    e.payment_status,
    e.created_at
  FROM enrollments e
  JOIN participants p ON e.participant_id = p.id
  JOIN programs pr ON e.program_id = pr.id
  LEFT JOIN classes c ON e.class_id = c.id
  WHERE p.user_id = p_user_id
  ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create index for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_enrollments_participant_id ON enrollments(participant_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);

-- Step 7: Output summary
-- ============================================================================

DO $$
DECLARE
  participant_count INTEGER;
  enrollment_count INTEGER;
  unlinked_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO participant_count FROM participants WHERE user_id IS NOT NULL;
  SELECT COUNT(*) INTO enrollment_count FROM enrollments;
  SELECT COUNT(*) INTO unlinked_count FROM enrollments e
  WHERE NOT EXISTS (
    SELECT 1 FROM participants p WHERE p.id = e.participant_id AND p.user_id IS NOT NULL
  );
  
  RAISE NOTICE 'Fix complete. Summary:';
  RAISE NOTICE '- Participants with user_id: %', participant_count;
  RAISE NOTICE '- Total enrollments: %', enrollment_count;
  RAISE NOTICE '- Enrollments without linked user: %', unlinked_count;
END $$;
