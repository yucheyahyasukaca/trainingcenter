-- Complete Storage Reset
-- This will completely reset the storage setup

-- Step 1: Drop and recreate the bucket completely
DROP POLICY IF EXISTS "payment_proofs_open" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete payment proofs" ON storage.objects;

-- Step 2: Delete the bucket and recreate it
DELETE FROM storage.buckets WHERE id = 'payment-proofs';

-- Step 3: Create a fresh bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
);

-- Step 4: Create simple policies
CREATE POLICY "payment_proofs_public" ON storage.objects
FOR ALL USING (bucket_id = 'payment-proofs');

-- Step 5: Create a sample file
INSERT INTO storage.objects (bucket_id, name, data, content_type)
VALUES (
  'payment-proofs',
  'sample/sample.png',
  decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'),
  'image/png'
);

-- Step 6: Clear all problematic enrollment URLs
UPDATE enrollments 
SET payment_proof_url = NULL
WHERE payment_proof_url IS NOT NULL;

-- Step 7: Show results
SELECT 'Storage completely reset!' as message;
SELECT id, name, public FROM storage.buckets WHERE id = 'payment-proofs';
SELECT name FROM storage.objects WHERE bucket_id = 'payment-proofs';
