-- ============================================================================
-- UPDATE TRAINER AVATAR URL
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script updates the trainer's avatar_url in the database
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Update trainer avatar_url (replace with your actual trainer ID and URL)
UPDATE trainers
SET avatar_url = 'https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/42b63c7d-40fa-4b23-9be2-55b4dad1d97c/avatars/42b63c7d-40fa-4b23-9be2-55b4dad1d97c_1761478001915.jpg'
WHERE email = 'trainer@garuda-21.com';

-- OR update all trainers with a default avatar
-- UPDATE trainers
-- SET avatar_url = 'https://your-default-avatar-url.com/avatar.jpg'
-- WHERE avatar_url IS NULL;

-- Verify the update
SELECT id, name, email, avatar_url 
FROM trainers 
WHERE email = 'trainer@garuda-21.com';
