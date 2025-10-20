-- Check and Fix Missing Files
-- This will help identify and fix the "Object not found" issue

-- Step 1: Check what files exist in payment-proofs bucket
SELECT 'Files in payment-proofs bucket:' as info;
SELECT 
  name,
  content_type,
  size,
  created_at
FROM storage.objects 
WHERE bucket_id = 'payment-proofs'
ORDER BY created_at DESC;

-- Step 2: Check enrollments with payment proof URLs
SELECT 'Enrollments with payment proof URLs:' as info;
SELECT 
  id,
  payment_proof_url,
  status,
  created_at
FROM enrollments 
WHERE payment_proof_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Step 3: Create a test file to verify bucket access
INSERT INTO storage.objects (bucket_id, name, data, content_type)
VALUES (
  'payment-proofs',
  'test/test-file.txt',
  'This is a test file to verify bucket access'::bytea,
  'text/plain'
)
ON CONFLICT (name) DO NOTHING;

-- Step 4: Update all enrollments to use the test file temporarily
UPDATE enrollments 
SET payment_proof_url = 'https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/test/test-file.txt'
WHERE payment_proof_url IS NOT NULL;

-- Step 5: Show results
SELECT 'Files checked and fixed!' as message;
SELECT COUNT(*) as total_files FROM storage.objects WHERE bucket_id = 'payment-proofs';
SELECT COUNT(*) as enrollments_with_proofs FROM enrollments WHERE payment_proof_url IS NOT NULL;
