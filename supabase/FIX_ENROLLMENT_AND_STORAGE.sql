-- Fix Enrollment and Storage Issues
-- ============================================================================

-- Step 1: Ensure storage bucket exists
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Fix storage RLS policies
-- ============================================================================
-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins and managers can view all payment proofs" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Users can upload their own payment proofs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own payment proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins and managers can view all payment proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-proofs' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Step 3: Ensure participants table has user_id column
-- ============================================================================
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Step 4: Fix participants RLS policies
-- ============================================================================
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own participant record" ON participants;
DROP POLICY IF EXISTS "Users can insert their own participant record" ON participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON participants;
DROP POLICY IF EXISTS "Admins and managers can manage all participants" ON participants;

-- Create new policies
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
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "Users can update their own participant record" ON participants
FOR UPDATE USING (
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

-- Step 5: Fix enrollments RLS policies
-- ============================================================================
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can delete their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins and managers can manage all enrollments" ON enrollments;

-- Create new policies
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

-- Step 6: Ensure required columns exist
-- ============================================================================
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 7: Update existing participant records to link with user_profiles
-- ============================================================================
UPDATE participants 
SET user_id = user_profiles.id
FROM user_profiles 
WHERE participants.email = user_profiles.email 
AND participants.user_id IS NULL;

-- Step 8: Create function to handle enrollment creation
-- ============================================================================
CREATE OR REPLACE FUNCTION create_enrollment(
  p_program_id UUID,
  p_class_id UUID DEFAULT NULL,
  p_payment_proof_url TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_participant_id UUID;
  v_enrollment_id UUID;
BEGIN
  -- Get or create participant record
  SELECT id INTO v_participant_id
  FROM participants 
  WHERE user_id = auth.uid();
  
  IF v_participant_id IS NULL THEN
    -- Create new participant record
    INSERT INTO participants (user_id, name, email, phone, created_at, updated_at)
    SELECT 
      auth.uid(),
      user_profiles.full_name,
      user_profiles.email,
      user_profiles.phone,
      NOW(),
      NOW()
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
    RETURNING id INTO v_participant_id;
  END IF;
  
  -- Create enrollment
  INSERT INTO enrollments (
    participant_id,
    program_id,
    class_id,
    status,
    payment_status,
    payment_proof_url,
    notes,
    created_at,
    updated_at
  )
  VALUES (
    v_participant_id,
    p_program_id,
    p_class_id,
    'pending',
    CASE WHEN p_payment_proof_url IS NOT NULL THEN 'pending' ELSE 'free' END,
    p_payment_proof_url,
    p_notes,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_enrollment_id;
  
  RETURN v_enrollment_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_enrollment TO authenticated;
