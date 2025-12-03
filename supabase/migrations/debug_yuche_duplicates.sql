
-- Find all trainers with the name 'Yuche Yahya Sukaca' (or similar)
-- We check both the 'name' column in trainers and the linked user_profiles
SELECT 
    t.id as trainer_id, 
    t.user_id, 
    t.name as trainer_name, 
    up.full_name as profile_name,
    thp.total_points,
    t.created_at
FROM trainers t
LEFT JOIN user_profiles up ON t.user_id = up.id
LEFT JOIN trainer_hebat_points thp ON t.id = thp.trainer_id
WHERE t.name ILIKE '%Yuche%' OR up.full_name ILIKE '%Yuche%';
