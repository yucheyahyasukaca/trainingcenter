
-- Check for duplicate trainers for the same user
SELECT user_id, COUNT(*)
FROM trainers
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Check for duplicate points records for the same trainer
SELECT trainer_id, COUNT(*)
FROM trainer_hebat_points
GROUP BY trainer_id
HAVING COUNT(*) > 1;

-- List all trainers with their user info to see the duplicates
SELECT t.id as trainer_id, t.user_id, up.full_name, up.email
FROM trainers t
JOIN user_profiles up ON t.user_id = up.id
WHERE t.user_id IN (
    SELECT user_id
    FROM trainers
    GROUP BY user_id
    HAVING COUNT(*) > 1
);
