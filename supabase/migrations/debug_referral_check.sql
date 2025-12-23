-- Diagnostic Script to check Referral Points Data
-- Run this in Supabase SQL Editor

SELECT 'Referral Tracking Count (Total)' as metric, count(*)::text as value FROM referral_tracking
UNION ALL
SELECT 'Trainers Count', count(*)::text FROM trainers
UNION ALL
SELECT 'Trainer Hebat Activities Count', count(*)::text FROM trainer_hebat_activities
UNION ALL
SELECT 'Trainer Hebat Points Row Count', count(*)::text FROM trainer_hebat_points;

-- Check IDs for the user with 17 referrals
-- We'll look for trainers who have referrals and see their IDs
SELECT 
    t.email,
    t.id as trainer_uuid,
    t.user_id as auth_id,
    (SELECT COUNT(*) FROM referral_tracking rt WHERE rt.trainer_id = t.user_id) as referrals_by_auth_id,
    (SELECT COUNT(*) FROM referral_tracking rt WHERE rt.trainer_id = t.id) as referrals_by_uuid,
    (SELECT b_points FROM trainer_hebat_points thp WHERE thp.trainer_id = t.user_id) as points_by_auth_id,
    (SELECT b_points FROM trainer_hebat_points thp WHERE thp.trainer_id = t.id) as points_by_uuid
FROM trainers t
WHERE EXISTS (
    SELECT 1 FROM referral_tracking rt 
    WHERE rt.trainer_id = t.user_id OR rt.trainer_id = t.id
)
LIMIT 5;

-- Check table constraints to see what trainer_id references
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name, 
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('referral_tracking', 'trainer_hebat_points', 'trainer_hebat_activities');
