-- Debug Script V2
-- Trainer ID: 42b63c7d-40fa-4b23-9be2-55b4dad1d97c

-- 1. Check if trainer exists in trainers table
SELECT '1. Trainer Check' as step, count(*) as count, id, name 
FROM trainers 
WHERE id = '42b63c7d-40fa-4b23-9be2-55b4dad1d97c'
GROUP BY id, name;

-- 2. Check activities count and sum
SELECT '2. Activities Check' as step, count(*) as count, SUM(points) as total_points
FROM trainer_hebat_activities 
WHERE trainer_id = '42b63c7d-40fa-4b23-9be2-55b4dad1d97c' AND category = 'B';

-- 3. Check current points in summary table
SELECT '3. Points Summary Check' as step, b_points, total_points 
FROM trainer_hebat_points 
WHERE trainer_id = '42b63c7d-40fa-4b23-9be2-55b4dad1d97c';

-- 4. Check referral tracking count again
SELECT '4. Referral Tracking Check' as step, count(*) as count
FROM referral_tracking
WHERE trainer_id = '42b63c7d-40fa-4b23-9be2-55b4dad1d97c';
