-- ============================================================================
-- UPDATE TRAINER EXPERIENCE YEARS
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================

-- Update experience_years for specific trainer
UPDATE trainers
SET experience_years = 5  -- Change this to the desired years
WHERE email = 'trainer@garuda-21.com';

-- Or update all trainers with default experience
-- UPDATE trainers
-- SET experience_years = COALESCE(experience_years, 2);

-- Verify the update
SELECT id, name, email, experience_years, status
FROM trainers
WHERE email = 'trainer@garuda-21.com';
