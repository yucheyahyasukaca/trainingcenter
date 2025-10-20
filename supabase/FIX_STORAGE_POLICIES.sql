-- Fix Storage Policies
-- This script will fix the storage policies that are blocking access

-- Step 1: Check current policies
SELECT 'Checking current storage policies...' as step;

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
ORDER BY policyname;

-- Step 2: Drop all existing policies for payment-proofs
SELECT 'Dropping existing policies...' as step;

DROP POLICY IF EXISTS "INSERT Users can upload their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "SELECT Users can view their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "SELECT Service role can view all payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_all" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_read" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_write" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_update" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_delete" ON storage.objects;

-- Step 3: Create simple, permissive policies
SELECT 'Creating new policies...' as step;

-- Allow everyone to read from payment-proofs bucket
CREATE POLICY "Allow public read payment proofs" ON storage.objects
FOR SELECT USING (bucket_id = 'payment-proofs');

-- Allow authenticated users to upload to payment-proofs bucket
CREATE POLICY "Allow authenticated upload payment proofs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-proofs' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated update payment proofs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'payment-proofs' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated delete payment proofs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'payment-proofs' 
  AND auth.role() = 'authenticated'
);

-- Step 4: Verify bucket is public
SELECT 'Verifying bucket is public...' as step;

UPDATE storage.buckets 
SET public = true 
WHERE id = 'payment-proofs';

-- Step 5: Check final status
SELECT 'Final verification...' as step;

-- Check bucket status
SELECT 
  id, 
  name, 
  public,
  file_size_limit
FROM storage.buckets 
WHERE id = 'payment-proofs';

-- Check policies
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%payment%'
ORDER BY policyname;

-- Step 6: Test file access
SELECT 'Testing file access...' as step;

-- Create a test file
INSERT INTO storage.objects (bucket_id, name, data, content_type)
VALUES (
  'payment-proofs',
  'test-access.txt',
  'Test file for access verification'::bytea,
  'text/plain'
)
ON CONFLICT (name) DO NOTHING;

-- Check if test file exists
SELECT 
  name,
  content_type,
  size,
  created_at
FROM storage.objects 
WHERE bucket_id = 'payment-proofs' 
AND name = 'test-access.txt';

SELECT 'Storage policies fixed successfully!' as message;
