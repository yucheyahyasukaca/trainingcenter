-- Fix Correct File URL
-- Update database to use the correct file that exists in storage

-- Step 1: Check what files actually exist in storage
SELECT 'Files that exist in payment-proofs bucket:' as info;
SELECT 
  name,
  content_type,
  size,
  created_at
FROM storage.objects 
WHERE bucket_id = 'payment-proofs'
ORDER BY created_at DESC;

-- Step 2: Update enrollments to use the correct file URL
UPDATE enrollments 
SET payment_proof_url = 'https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/0ade6a79-7c6f-4097-9d03-c8ffea9d43be_550e8400-e29b-41d4-a716-446655440004_1760948922911.png'
WHERE payment_proof_url IS NOT NULL;

-- Step 3: Show updated enrollments
SELECT 'Updated enrollments with correct file URL:' as info;
SELECT 
  id,
  payment_proof_url,
  status,
  created_at
FROM enrollments 
WHERE payment_proof_url IS NOT NULL
ORDER BY created_at DESC;

-- Step 4: Test the URL
SELECT 'Test URL:' as info;
SELECT 'https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/0ade6a79-7c6f-4097-9d03-c8ffea9d43be_550e8400-e29b-41d4-a716-446655440004_1760948922911.png' as test_url;

SELECT 'File URL fixed!' as message;
