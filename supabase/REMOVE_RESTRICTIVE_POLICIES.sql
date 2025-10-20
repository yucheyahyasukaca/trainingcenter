-- Remove Restrictive Policies
-- Simple script to remove policies that block access

-- Step 1: Remove all restrictive policies
DROP POLICY IF EXISTS "INSERT Users can upload their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "SELECT Users can view their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "SELECT Service role can view all payment proofs" ON storage.objects;

-- Step 2: Create one simple policy that allows everything
CREATE POLICY "payment_proofs_open" ON storage.objects
FOR ALL USING (bucket_id = 'payment-proofs');

-- Step 3: Make sure bucket is public
UPDATE storage.buckets SET public = true WHERE id = 'payment-proofs';

-- Step 4: Show result
SELECT 'Policies removed and simplified!' as message;
SELECT id, name, public FROM storage.buckets WHERE id = 'payment-proofs';
