-- Fix Assignment Storage Bucket and RLS
-- ============================================================================

-- Step 1: Create storage bucket for assignments if not exists
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignments',
  'assignments',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing policies if they exist
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can upload to assignments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view assignments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete assignments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own assignments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own assignments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all assignments" ON storage.objects;
DROP POLICY IF EXISTS "Trainers can delete assignments" ON storage.objects;
DROP POLICY IF EXISTS "Trainers can insert assignments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can insert assignments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete assignments" ON storage.objects;

-- Step 3: Create permissive policies for assignments (like payment-proofs)
-- ============================================================================

-- Allow authenticated users to upload to assignments bucket
-- Users can only upload to their own folder
CREATE POLICY "Users can upload their own assignments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'assignments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow trainers/admin/manager to upload to ANY folder
CREATE POLICY "Trainers can insert assignments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'assignments' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager', 'trainer')
  )
);

-- Allow users to view their own files in assignments bucket
-- Trainers/admin/manager can view all
CREATE POLICY "Users can view their own assignments" ON storage.objects
FOR SELECT USING (
  bucket_id = 'assignments' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'manager', 'trainer')
    )
  )
);

-- Allow trainers/admins to delete any assignments
CREATE POLICY "Trainers can delete assignments" ON storage.objects
FOR DELETE USING (
  bucket_id = 'assignments' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'manager', 'trainer')
    )
  )
);

-- Step 4: Verify bucket creation
-- ============================================================================
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'assignments';

-- Step 5: Verify storage policies
-- ============================================================================
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%assignments%';

-- Step 6: Disable RLS for debug purposes
-- ============================================================================
-- TEMPORARY: Disable RLS to debug CORS issues
-- COMMENT OUT BELOW LINES AFTER DEBUGGING!
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================

