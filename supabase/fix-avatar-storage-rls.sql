-- ============================================================================
-- FIX AVATAR STORAGE RLS
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script fixes RLS policies to allow avatar uploads
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP EXISTING POLICIES (IF ANY)
-- ============================================================================

DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avatars" ON storage.objects;

-- ============================================================================
-- STEP 2: ADD PUBLIC READ POLICY FOR AVATARS IN PAYMENT-PROOFS BUCKET
-- ============================================================================

-- Allow public read access to avatars (files in avatars folder or any file in payment-proofs)
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-proofs'
);

-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-proofs' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to update avatars
CREATE POLICY "Users can update avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'payment-proofs' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete avatars
CREATE POLICY "Users can delete avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'payment-proofs' AND
  auth.role() = 'authenticated'
);

-- ============================================================================
-- STEP 3: VERIFICATION
-- ============================================================================

-- Check all policies for payment-proofs bucket
SELECT 
  policyname,
  permissive,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage' 
AND (policyname LIKE '%payment%' OR policyname LIKE '%avatar%')
ORDER BY policyname;
