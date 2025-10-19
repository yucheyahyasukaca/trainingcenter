-- Debug Enrollment Issue
-- ============================================================================

-- Step 1: Check if participant record exists for current user
-- ============================================================================
SELECT 
  p.id as participant_id,
  p.user_id,
  p.name,
  p.email,
  up.id as user_profile_id,
  up.email as user_profile_email
FROM participants p
LEFT JOIN user_profiles up ON p.user_id = up.id
WHERE p.user_id = auth.uid();

-- Step 2: Check enrollments for this participant
-- ============================================================================
SELECT 
  e.id,
  e.participant_id,
  e.program_id,
  e.status,
  e.payment_status,
  e.created_at,
  p.title as program_title
FROM enrollments e
JOIN participants part ON e.participant_id = part.id
JOIN programs p ON e.program_id = p.id
WHERE part.user_id = auth.uid()
ORDER BY e.created_at DESC;

-- Step 3: Check RLS policies on enrollments
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'enrollments';

-- Step 4: Check RLS policies on participants
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'participants';

-- Step 5: Test enrollment creation with function
-- ============================================================================
-- This will create a test enrollment (replace with actual program_id)
-- SELECT create_enrollment(
--   'your-program-id-here'::uuid,
--   NULL::uuid,
--   NULL::text,
--   'Test enrollment from debug script'::text
-- );

-- Step 6: Check storage bucket and policies
-- ============================================================================
SELECT * FROM storage.buckets WHERE id = 'payment-proofs';

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
