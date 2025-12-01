-- Fix ID Mismatch for Yuche Yahya Sukaca
-- Correct ID: d0954ef1-30c7-4360-be95-7207988c4bd3
-- Wrong ID: d0954ef1-30c7-4360-be95-7207988c4b5a

BEGIN;

-- 1. Update referral_tracking to point to the correct trainer ID
-- This fixes the records that are pointing to the wrong ID ending in ...b5a
UPDATE referral_tracking
SET trainer_id = 'd0954ef1-30c7-4360-be95-7207988c4bd3'
WHERE trainer_id = 'd0954ef1-30c7-4360-be95-7207988c4b5a';

-- 2. Also ensure any tracking linked to his codes is correct (double check)
-- This fixes any other records that might be mismatched
UPDATE referral_tracking rt
SET trainer_id = 'd0954ef1-30c7-4360-be95-7207988c4bd3'
FROM referral_codes rc
WHERE rt.referral_code_id = rc.id
AND rc.trainer_id = 'd0954ef1-30c7-4360-be95-7207988c4bd3'
AND (rt.trainer_id IS NULL OR rt.trainer_id != 'd0954ef1-30c7-4360-be95-7207988c4bd3');

-- 3. Ensure Trainer Record Exists
INSERT INTO trainers (id, name, email, created_at, updated_at, specialization, experience_years, phone)
SELECT id, full_name, email, NOW(), NOW(), 'General', 0, '-'
FROM user_profiles
WHERE id = 'd0954ef1-30c7-4360-be95-7207988c4bd3'
ON CONFLICT (id) DO NOTHING;

-- 4. Recalculate Points
-- Clear existing activities for this trainer to avoid duplicates during regen
DELETE FROM trainer_hebat_activities 
WHERE trainer_id = 'd0954ef1-30c7-4360-be95-7207988c4bd3' 
AND category = 'B';

-- Insert fresh activities
INSERT INTO trainer_hebat_activities (
    trainer_id,
    category,
    activity_type,
    description,
    points,
    metadata
)
SELECT 
    'd0954ef1-30c7-4360-be95-7207988c4bd3',
    'B',
    'referral',
    'Referral registered',
    2, -- 2 Points per GTK
    jsonb_build_object('referral_id', rt.id, 'referral_type', 'GTK')
FROM referral_tracking rt
WHERE rt.trainer_id = 'd0954ef1-30c7-4360-be95-7207988c4bd3';

-- Update Summary
INSERT INTO trainer_hebat_points (trainer_id, b_points, total_points)
VALUES (
    'd0954ef1-30c7-4360-be95-7207988c4bd3',
    (SELECT COALESCE(SUM(points), 0) FROM trainer_hebat_activities WHERE trainer_id = 'd0954ef1-30c7-4360-be95-7207988c4bd3' AND category = 'B'),
    (SELECT COALESCE(SUM(points), 0) FROM trainer_hebat_activities WHERE trainer_id = 'd0954ef1-30c7-4360-be95-7207988c4bd3')
)
ON CONFLICT (trainer_id) DO UPDATE SET
    b_points = EXCLUDED.b_points,
    total_points = EXCLUDED.total_points,
    updated_at = NOW();

COMMIT;

-- Verify Results
SELECT 
    t.name,
    thp.b_points as berbagi_points,
    thp.total_points,
    (SELECT count(*) FROM referral_tracking WHERE trainer_id = 'd0954ef1-30c7-4360-be95-7207988c4bd3') as actual_referrals
FROM trainers t
LEFT JOIN trainer_hebat_points thp ON thp.trainer_id = t.id
WHERE t.id = 'd0954ef1-30c7-4360-be95-7207988c4bd3';
