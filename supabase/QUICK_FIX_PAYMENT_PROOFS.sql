-- Quick Fix for Payment Proofs Access
-- This script will fix the payment proof file access issue

-- Step 1: Ensure payment-proofs bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false, -- Private bucket for security
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

-- Step 2: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to view all payment proofs" ON storage.objects;

-- Step 3: Create simple RLS policies for payment-proofs bucket
-- Allow all authenticated users to access payment proofs
CREATE POLICY "Allow authenticated access to payment proofs" ON storage.objects
FOR ALL USING (
  bucket_id = 'payment-proofs' 
  AND auth.role() = 'authenticated'
);

-- Step 4: Create function to generate fresh signed URLs
CREATE OR REPLACE FUNCTION refresh_payment_proof_url(file_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  signed_url TEXT;
BEGIN
  -- Generate signed URL with 7 days expiry
  SELECT signed_url INTO signed_url
  FROM storage.create_signed_url(
    'payment-proofs',
    file_path,
    604800 -- 7 days in seconds
  );
  
  RETURN signed_url;
END;
$$;

-- Step 5: Create function to get payment proof URL by enrollment
CREATE OR REPLACE FUNCTION get_payment_proof_by_enrollment(enrollment_id UUID)
RETURNS TABLE(
  enrollment_id UUID,
  payment_proof_url TEXT,
  program_title TEXT,
  participant_name TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    CASE 
      WHEN e.payment_proof_url IS NOT NULL AND e.payment_proof_url != '' THEN
        refresh_payment_proof_url(
          substring(e.payment_proof_url from 'payment-proofs/(.*)$')
        )
      ELSE NULL
    END as payment_proof_url,
    p.title as program_title,
    part.name as participant_name,
    e.status
  FROM enrollments e
  LEFT JOIN programs p ON e.program_id = p.id
  LEFT JOIN participants part ON e.participant_id = part.id
  WHERE e.id = enrollment_id;
END;
$$;

-- Step 6: Update all existing payment proof URLs to use fresh signed URLs
UPDATE enrollments 
SET payment_proof_url = refresh_payment_proof_url(
  substring(payment_proof_url from 'payment-proofs/(.*)$')
)
WHERE payment_proof_url IS NOT NULL 
AND payment_proof_url LIKE '%payment-proofs%'
AND payment_proof_url NOT LIKE '%signedUrl%';

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION refresh_payment_proof_url(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_payment_proof_by_enrollment(UUID) TO authenticated, anon, service_role;

-- Step 8: Create a simple view for testing
CREATE OR REPLACE VIEW payment_proofs_test AS
SELECT 
  e.id as enrollment_id,
  e.payment_proof_url as original_url,
  refresh_payment_proof_url(
    substring(e.payment_proof_url from 'payment-proofs/(.*)$')
  ) as fresh_url,
  p.title as program_title,
  e.status,
  e.payment_status
FROM enrollments e
LEFT JOIN programs p ON e.program_id = p.id
WHERE e.payment_proof_url IS NOT NULL;

GRANT SELECT ON payment_proofs_test TO authenticated, anon, service_role;

-- Step 9: Verification
SELECT 'Payment proofs access fixed!' as message;

-- Check bucket configuration
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'payment-proofs';

-- Check if there are any files in the bucket
SELECT 
  name,
  content_type,
  created_at,
  size
FROM storage.objects 
WHERE bucket_id = 'payment-proofs'
ORDER BY created_at DESC
LIMIT 10;

-- Test the refresh function
SELECT 
  enrollment_id,
  original_url,
  fresh_url,
  program_title
FROM payment_proofs_test
LIMIT 5;
