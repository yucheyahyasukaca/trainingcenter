-- Emergency Storage Fix
-- Very simple script to fix storage issues

-- Step 1: Make sure bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 2: Remove all policies to avoid conflicts
DELETE FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%payment%';

-- Step 3: Create one simple policy
CREATE POLICY "payment_proofs_all" ON storage.objects
FOR ALL USING (bucket_id = 'payment-proofs');

-- Step 4: Create a test file
INSERT INTO storage.objects (bucket_id, name, data, content_type)
VALUES (
  'payment-proofs',
  'test.txt',
  'test content'::bytea,
  'text/plain'
);

-- Step 5: Show results
SELECT 'Emergency fix completed!' as message;
SELECT id, name, public FROM storage.buckets WHERE id = 'payment-proofs';
SELECT name FROM storage.objects WHERE bucket_id = 'payment-proofs';
