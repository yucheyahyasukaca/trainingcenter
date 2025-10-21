-- Cleanup Sample Enrollments
-- ============================================================================
-- This script removes sample enrollments that were created by setup scripts
-- and might be showing as "Sudah Terdaftar" for new users
-- ============================================================================

-- Step 1: Check current enrollments with sample data
-- ============================================================================
SELECT 
  e.id,
  e.participant_id,
  e.program_id,
  e.status,
  e.notes,
  e.created_at,
  p.title as program_title,
  part.name as participant_name
FROM enrollments e
JOIN participants part ON e.participant_id = part.id
JOIN programs p ON e.program_id = p.id
WHERE e.notes IS NOT NULL 
  AND (
    e.notes ILIKE '%sample%' OR 
    e.notes ILIKE '%test%' OR
    e.notes ILIKE '%Sample enrollment%'
  )
ORDER BY e.created_at DESC;

-- Step 2: Delete sample enrollments
-- ============================================================================
DELETE FROM enrollments 
WHERE notes IS NOT NULL 
  AND (
    notes ILIKE '%sample%' OR 
    notes ILIKE '%test%' OR
    notes ILIKE '%Sample enrollment%'
  );

-- Step 2.1: Delete all enrollments for users created recently (within last hour)
-- This is more aggressive cleanup for new users
DELETE FROM enrollments 
WHERE participant_id IN (
  SELECT p.id 
  FROM participants p
  WHERE p.created_at > NOW() - INTERVAL '1 hour'
);

-- Step 2.2: Delete enrollments that were created very recently (within last 5 minutes)
-- and have approved status (likely sample data)
DELETE FROM enrollments 
WHERE created_at > NOW() - INTERVAL '5 minutes'
  AND status = 'approved';

-- Step 3: Also clean up any enrollments that might be linked to test participants
-- ============================================================================
DELETE FROM enrollments 
WHERE participant_id IN (
  SELECT p.id 
  FROM participants p
  JOIN user_profiles up ON p.user_id = up.id
  WHERE up.email LIKE '%@garuda-21.com'
    AND up.role = 'user'
    AND p.created_at < NOW() - INTERVAL '1 day'
);

-- Step 4: Verify cleanup
-- ============================================================================
SELECT 
  'Remaining enrollments' as status,
  COUNT(*) as count
FROM enrollments;

-- Step 5: Check for any remaining sample data
-- ============================================================================
SELECT 
  'Sample enrollments remaining' as status,
  COUNT(*) as count
FROM enrollments 
WHERE notes IS NOT NULL 
  AND (
    notes ILIKE '%sample%' OR 
    notes ILIKE '%test%' OR
    notes ILIKE '%Sample enrollment%'
  );

-- Step 6: Show current enrollments by user
-- ============================================================================
SELECT 
  up.email,
  up.role,
  COUNT(e.id) as enrollment_count,
  STRING_AGG(e.status, ', ') as enrollment_statuses
FROM user_profiles up
LEFT JOIN participants p ON p.user_id = up.id
LEFT JOIN enrollments e ON e.participant_id = p.id
GROUP BY up.email, up.role
ORDER BY up.role, up.email;
