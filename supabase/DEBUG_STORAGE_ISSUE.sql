-- Debug Storage Issue
-- This script will help identify and fix storage problems

-- Step 1: Check if payment-proofs bucket exists and its configuration
SELECT 'Checking payment-proofs bucket...' as step;

SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'payment-proofs';

-- Step 2: Check what files exist in the bucket
SELECT 'Checking files in payment-proofs bucket...' as step;

SELECT 
  name,
  content_type,
  size,
  created_at,
  updated_at
FROM storage.objects 
WHERE bucket_id = 'payment-proofs'
ORDER BY created_at DESC;

-- Step 3: Check enrollments with payment proof URLs
SELECT 'Checking enrollments with payment proof URLs...' as step;

SELECT 
  id,
  payment_proof_url,
  status,
  payment_status,
  created_at
FROM enrollments 
WHERE payment_proof_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Step 4: Check if there are any files that match the enrollment URLs
SELECT 'Checking file path matching...' as step;

SELECT 
  e.id as enrollment_id,
  e.payment_proof_url,
  o.name as file_name,
  o.size as file_size,
  CASE 
    WHEN o.name IS NOT NULL THEN 'FILE EXISTS'
    ELSE 'FILE NOT FOUND'
  END as file_status
FROM enrollments e
LEFT JOIN storage.objects o ON (
  o.bucket_id = 'payment-proofs' 
  AND e.payment_proof_url LIKE '%' || o.name
)
WHERE e.payment_proof_url IS NOT NULL
ORDER BY e.created_at DESC
LIMIT 10;

-- Step 5: Create a test file to verify bucket access
SELECT 'Creating test file...' as step;

INSERT INTO storage.objects (bucket_id, name, owner, data, content_type)
SELECT 
  'payment-proofs',
  'test/verification.txt',
  (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  'Test file for verification'::bytea,
  'text/plain'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.objects 
  WHERE bucket_id = 'payment-proofs' 
  AND name = 'test/verification.txt'
);

-- Step 6: Check if test file was created successfully
SELECT 'Verifying test file creation...' as step;

SELECT 
  name,
  content_type,
  size,
  created_at
FROM storage.objects 
WHERE bucket_id = 'payment-proofs' 
AND name = 'test/verification.txt';

-- Step 7: Show bucket policies
SELECT 'Checking bucket policies...' as step;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%payment%';

-- Step 8: Final verification
SELECT 'Debug completed!' as message;
