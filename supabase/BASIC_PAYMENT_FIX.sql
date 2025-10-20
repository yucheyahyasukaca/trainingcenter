-- Basic Payment Proof Fix
-- Simple script to fix payment proof access

-- Step 1: Make payment-proofs bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'payment-proofs';

-- If bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Remove complex policies and create simple ones
DROP POLICY IF EXISTS "Allow public access to payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated access to payment proofs" ON storage.objects;

-- Create simple policy
CREATE POLICY "payment_proofs_policy" ON storage.objects
FOR ALL USING (bucket_id = 'payment-proofs');

-- Step 3: Update existing URLs to use public format
UPDATE enrollments 
SET payment_proof_url = 'https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/' || 
  substring(payment_proof_url from 'payment-proofs/(.*)$')
WHERE payment_proof_url IS NOT NULL 
AND payment_proof_url LIKE '%payment-proofs%'
AND payment_proof_url NOT LIKE '%supabase.garuda-21.com%';

-- Step 4: Show results
SELECT 'Basic payment proof fix completed!' as message;

-- Check bucket
SELECT id, name, public FROM storage.buckets WHERE id = 'payment-proofs';

-- Check files
SELECT name, content_type FROM storage.objects WHERE bucket_id = 'payment-proofs' LIMIT 3;
