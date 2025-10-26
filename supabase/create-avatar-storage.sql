-- ============================================================================
-- CREATE AVATAR STORAGE BUCKET
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script creates a storage bucket for user avatar images
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE STORAGE BUCKET FOR AVATARS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: CREATE STORAGE POLICIES FOR AVATARS
-- ============================================================================

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Authenticated users can update avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Authenticated users can delete avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to avatars
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if the bucket was created successfully
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'avatars';

-- Check if the policies were created successfully
SELECT 
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%avatar%'
ORDER BY policyname;
