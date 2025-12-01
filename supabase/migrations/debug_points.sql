-- Check data for the trainer ID from the error message
-- Trainer ID: 42b63c7d-40fa-4b23-9be2-55b4dad1d97c

SELECT 'Referral Tracking Count' as check_type, count(*) as count 
FROM referral_tracking 
WHERE trainer_id = '42b63c7d-40fa-4b23-9be2-55b4dad1d97c';

SELECT 'Hebat Activities Count' as check_type, count(*) as count 
FROM trainer_hebat_activities 
WHERE trainer_id = '42b63c7d-40fa-4b23-9be2-55b4dad1d97c' AND category = 'B';

SELECT 'Hebat Points' as check_type, b_points, total_points 
FROM trainer_hebat_points 
WHERE trainer_id = '42b63c7d-40fa-4b23-9be2-55b4dad1d97c';

-- Check if the trainer exists in trainers table
SELECT 'Trainer Exists' as check_type, count(*) as count
FROM trainers
WHERE id = '42b63c7d-40fa-4b23-9be2-55b4dad1d97c';
