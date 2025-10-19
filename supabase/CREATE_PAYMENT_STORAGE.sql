-- Create Payment Storage Bucket and Policies
-- ============================================================================

-- Step 1: Create storage bucket for payment proofs
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Create RLS policies for payment proofs storage
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins and managers can view all payment proofs" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Users can upload their own payment proofs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own payment proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins and managers can view all payment proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-proofs' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Step 3: Verify bucket creation
-- ============================================================================
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'payment-proofs';

-- Step 4: Verify storage policies
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%payment%';
