-- Create Forum Attachments Storage Bucket and Policies
-- ============================================================================

-- Step 1: Create storage bucket for forum attachments
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'forum-attachments',
  'forum-attachments',
  true, -- Make it public so images can be displayed
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Create RLS policies for forum attachments storage
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can upload forum attachments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view forum attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own forum attachments" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Anyone can upload forum attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'forum-attachments'
);

CREATE POLICY "Anyone can view forum attachments" ON storage.objects
FOR SELECT USING (
  bucket_id = 'forum-attachments'
);

CREATE POLICY "Users can delete their own forum attachments" ON storage.objects
FOR DELETE USING (
  bucket_id = 'forum-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
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
WHERE id = 'forum-attachments';

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
WHERE tablename = 'objects' 
AND policyname LIKE '%forum%';