-- Simple Payment Proof Fix
-- This script will fix payment proof access issues step by step

-- Step 1: Check if payment-proofs bucket exists
SELECT 'Checking payment-proofs bucket...' as step;

SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'payment-proofs';

-- Step 2: Create or update payment-proofs bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  true, -- Make it public for easier access
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

-- Step 3: Remove all existing policies on storage.objects to avoid conflicts
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname LIKE '%payment%'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- Step 4: Create simple policies for payment-proofs
CREATE POLICY "Allow public access to payment proofs" ON storage.objects
FOR SELECT USING (bucket_id = 'payment-proofs');

CREATE POLICY "Allow authenticated users to upload payment proofs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-proofs' 
  AND auth.role() = 'authenticated'
);

-- Step 5: Create a simple function to get payment proof URL
CREATE OR REPLACE FUNCTION get_payment_proof_url_simple(file_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_url TEXT;
  full_url TEXT;
BEGIN
  -- Get the base URL from Supabase settings
  base_url := 'https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/';
  
  -- Construct the full URL
  full_url := base_url || file_path;
  
  RETURN full_url;
END;
$$;

-- Step 6: Update existing payment proof URLs to use public URLs
UPDATE enrollments 
SET payment_proof_url = 'https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/' || 
  substring(payment_proof_url from 'payment-proofs/(.*)$')
WHERE payment_proof_url IS NOT NULL 
AND payment_proof_url LIKE '%payment-proofs%'
AND payment_proof_url NOT LIKE '%supabase.garuda-21.com%';

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION get_payment_proof_url_simple(TEXT) TO authenticated, anon, service_role;

-- Step 8: Create a test file to verify bucket access
INSERT INTO storage.objects (bucket_id, name, owner, data, content_type)
SELECT 
  'payment-proofs',
  'test/sample.txt',
  (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  'Test file for payment proofs bucket'::bytea,
  'text/plain'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.objects 
  WHERE bucket_id = 'payment-proofs' 
  AND name = 'test/sample.txt'
);

-- Step 9: Verification
SELECT 'Payment proof fix completed!' as message;

-- Check bucket status
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  created_at
FROM storage.buckets 
WHERE id = 'payment-proofs';

-- Check if test file is accessible
SELECT 
  name,
  content_type,
  created_at,
  size
FROM storage.objects 
WHERE bucket_id = 'payment-proofs'
ORDER BY created_at DESC
LIMIT 5;

-- Check updated enrollments
SELECT 
  id,
  payment_proof_url,
  status,
  payment_status
FROM enrollments 
WHERE payment_proof_url IS NOT NULL
LIMIT 5;
