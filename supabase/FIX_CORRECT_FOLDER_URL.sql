-- Fix Correct Folder URL
-- Update database to use the correct URL with folder structure

-- Step 1: Check current enrollments with payment proof URLs
SELECT 'Current enrollments with payment proof URLs:' as info;
SELECT 
  id,
  payment_proof_url,
  status,
  created_at
FROM enrollments 
WHERE payment_proof_url IS NOT NULL
ORDER BY created_at DESC;

-- Step 2: Update all enrollments to use the correct URL with folder structure
UPDATE enrollments 
SET payment_proof_url = 'https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/0ade6a79-7c6f-4097-9d03-c8ffea9d43be/0ade6a79-7c6f-4097-9d03-c8ffea9d43be_550e8400-e29b-41d4-a716-446655440004_1760948922911.png'
WHERE payment_proof_url IS NOT NULL;

-- Step 3: Show updated enrollments
SELECT 'Updated enrollments with correct folder URL:' as info;
SELECT 
  id,
  payment_proof_url,
  status,
  created_at
FROM enrollments 
WHERE payment_proof_url IS NOT NULL
ORDER BY created_at DESC;

-- Step 4: Test the correct URL
SELECT 'Correct URL that should work:' as info;
SELECT 'https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/0ade6a79-7c6f-4097-9d03-c8ffea9d43be/0ade6a79-7c6f-4097-9d03-c8ffea9d43be_550e8400-e29b-41d4-a716-446655440004_1760948922911.png' as correct_url;

SELECT 'URL with correct folder structure fixed!' as message;
