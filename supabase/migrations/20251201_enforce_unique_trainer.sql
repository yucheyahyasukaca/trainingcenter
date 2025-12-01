-- Enforce 1:1 relationship between User and Trainer Profile
-- This prevents a single user account from being linked to multiple trainer profiles.

-- 1. Add unique constraint to user_id in trainers table
ALTER TABLE trainers
ADD CONSTRAINT unique_trainer_user_id UNIQUE (user_id);

-- Note: This might fail if there are still duplicates. 
-- The previous cleanup script should have resolved the specific case for 'Yuche Yahya Sukaca'.
-- If there are other duplicates, this migration will fail and alert us to clean them up first.
