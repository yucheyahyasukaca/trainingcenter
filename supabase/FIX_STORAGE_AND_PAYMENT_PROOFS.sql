-- Fix Storage and Payment Proofs Access
-- This script will fix storage bucket permissions and payment proof access

-- Step 1: Create payment-proofs bucket if it doesn't exist
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

-- Step 2: Create RLS policies for payment-proofs bucket
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload payment proofs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-proofs' 
  AND auth.role() = 'authenticated'
);

-- Allow users to view their own payment proofs
CREATE POLICY "Allow users to view their own payment proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-proofs' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own payment proofs
CREATE POLICY "Allow users to update their own payment proofs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'payment-proofs' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own payment proofs
CREATE POLICY "Allow users to delete their own payment proofs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'payment-proofs' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all payment proofs
CREATE POLICY "Allow admins to view all payment proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-proofs' 
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Step 3: Create function to generate signed URLs for payment proofs
CREATE OR REPLACE FUNCTION get_payment_proof_url(file_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  signed_url TEXT;
BEGIN
  -- Generate signed URL with 1 year expiry
  SELECT signed_url INTO signed_url
  FROM storage.create_signed_url(
    'payment-proofs',
    file_path,
    31536000 -- 1 year in seconds
  );
  
  RETURN signed_url;
END;
$$;

-- Step 4: Create function to upload payment proof
CREATE OR REPLACE FUNCTION upload_payment_proof(
  user_id UUID,
  program_id UUID,
  file_name TEXT,
  file_data BYTEA,
  content_type TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  file_path TEXT;
  file_ext TEXT;
  final_file_name TEXT;
  signed_url TEXT;
BEGIN
  -- Extract file extension
  file_ext := split_part(file_name, '.', -1);
  
  -- Create unique file name
  final_file_name := user_id::text || '_' || program_id::text || '_' || extract(epoch from now())::bigint || '.' || file_ext;
  
  -- Create file path
  file_path := user_id::text || '/' || final_file_name;
  
  -- Upload file to storage
  INSERT INTO storage.objects (bucket_id, name, owner, data, content_type)
  VALUES ('payment-proofs', file_path, user_id, file_data, content_type);
  
  -- Generate signed URL
  SELECT get_payment_proof_url(file_path) INTO signed_url;
  
  RETURN signed_url;
END;
$$;

-- Step 5: Create function to get payment proof URL by enrollment ID
CREATE OR REPLACE FUNCTION get_enrollment_payment_proof_url(enrollment_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  proof_url TEXT;
  file_path TEXT;
BEGIN
  -- Get payment proof URL from enrollment
  SELECT payment_proof_url INTO proof_url
  FROM enrollments
  WHERE id = enrollment_id;
  
  -- If URL exists, extract file path and generate new signed URL
  IF proof_url IS NOT NULL AND proof_url != '' THEN
    -- Extract file path from URL (assuming format: .../storage/v1/object/public/payment-proofs/path)
    file_path := substring(proof_url from 'payment-proofs/(.*)$');
    
    -- Generate new signed URL
    SELECT get_payment_proof_url(file_path) INTO proof_url;
  END IF;
  
  RETURN proof_url;
END;
$$;

-- Step 6: Update existing enrollments to fix payment proof URLs
UPDATE enrollments 
SET payment_proof_url = get_payment_proof_url(
  substring(payment_proof_url from 'payment-proofs/(.*)$')
)
WHERE payment_proof_url IS NOT NULL 
AND payment_proof_url LIKE '%payment-proofs%';

-- Step 7: Create view for enrollments with accessible payment proof URLs
CREATE OR REPLACE VIEW enrollments_with_payment_proofs AS
SELECT 
  e.*,
  get_enrollment_payment_proof_url(e.id) as accessible_payment_proof_url,
  p.title as program_title,
  p.price as program_price,
  part.name as participant_name,
  part.email as participant_email,
  c.name as class_name
FROM enrollments e
LEFT JOIN programs p ON e.program_id = p.id
LEFT JOIN participants part ON e.participant_id = part.id
LEFT JOIN classes c ON e.class_id = c.id;

-- Step 8: Grant permissions
GRANT EXECUTE ON FUNCTION get_payment_proof_url(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION upload_payment_proof(UUID, UUID, TEXT, BYTEA, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_enrollment_payment_proof_url(UUID) TO authenticated, anon, service_role;
GRANT SELECT ON enrollments_with_payment_proofs TO authenticated, anon, service_role;

-- Step 9: Create sample payment proof for testing
-- This will create a test file in the bucket
INSERT INTO storage.objects (bucket_id, name, owner, data, content_type)
SELECT 
  'payment-proofs',
  'test/sample_payment_proof.txt',
  (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  'Sample payment proof content'::bytea,
  'text/plain'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.objects 
  WHERE bucket_id = 'payment-proofs' 
  AND name = 'test/sample_payment_proof.txt'
);

-- Step 10: Verification
SELECT 'Storage and payment proofs setup completed!' as message;

-- Check bucket exists
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'payment-proofs';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- Check sample file
SELECT name, content_type, created_at
FROM storage.objects 
WHERE bucket_id = 'payment-proofs'
LIMIT 5;
