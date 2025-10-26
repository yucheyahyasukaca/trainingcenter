-- ============================================================================
-- MAKE PAYMENT-PROOFS BUCKET PUBLIC
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script makes the payment-proofs bucket public for avatar access
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: UPDATE BUCKET TO PUBLIC
-- ============================================================================

-- Make the payment-proofs bucket public
UPDATE storage.buckets
SET public = true
WHERE id = 'payment-proofs';

-- ============================================================================
-- STEP 2: VERIFICATION
-- ============================================================================

-- Check bucket configuration
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'payment-proofs';
