-- Fix Folder Structure
-- Update URLs to use correct folder structure

-- Step 1: Check what files exist in storage with folder structure
SELECT 'Files in storage with folder structure:' as info;
SELECT 
  name,
  content_type,
  size,
  created_at
FROM storage.objects 
WHERE bucket_id = 'payment-proofs'
AND name LIKE '%/%'  -- Files with folder structure
ORDER BY created_at DESC;

-- Step 2: Update enrollments to use files with correct folder structure
UPDATE enrollments 
SET payment_proof_url = 'https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/' || 
  (SELECT name FROM storage.objects 
   WHERE bucket_id = 'payment-proofs' 
   AND name LIKE '%/%' 
   ORDER BY created_at DESC 
   LIMIT 1)
WHERE payment_proof_url IS NOT NULL;

-- Step 3: If no folder structure files exist, use the specific file you mentioned
UPDATE enrollments 
SET payment_proof_url = 'https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/0ade6a79-7c6f-4097-9d03-c8ffea9d43be/0ade6a79-7c6f-4097-9d03-c8ffea9d43be_550e8400-e29b-41d4-a716-446655440004_1760948922911.png'
WHERE payment_proof_url IS NOT NULL 
AND payment_proof_url NOT LIKE '%supabase.garuda-21.com/storage/v1/object/public/payment-proofs/%';

-- Step 4: Show final results
SELECT 'Folder structure fixed!' as message;
SELECT 
  id,
  payment_proof_url,
  status
FROM enrollments 
WHERE payment_proof_url IS NOT NULL
LIMIT 5;
