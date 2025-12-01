-- Fix for Main Account (16 Referrals)
-- ID: d0954ef1-30c7-4360-be95-7207988c4bd3

DO $$
DECLARE
    v_trainer_id UUID := 'd0954ef1-30c7-4360-be95-7207988c4bd3';
    v_user_record RECORD;
BEGIN
    -- 1. Ensure Trainer Exists
    SELECT * INTO v_user_record FROM user_profiles WHERE id = v_trainer_id;
    
    IF v_user_record.id IS NOT NULL THEN
        INSERT INTO trainers (id, name, email, created_at, updated_at, specialization, experience_years, phone)
        VALUES (
            v_trainer_id,
            v_user_record.full_name,
            v_user_record.email,
            NOW(),
            NOW(),
            'General',
            0,
            '-'
        )
        ON CONFLICT (id) DO NOTHING;
    ELSE
        -- Fallback: Force insert if profile not found
        INSERT INTO trainers (id, name, email, created_at, updated_at, specialization, experience_years, phone)
        VALUES (
            v_trainer_id,
            'Fixed Trainer (Main)',
            'fixed_main@example.com',
            NOW(),
            NOW(),
            'General',
            0,
            '-'
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- 2. Backfill Activities (Points)
    -- Insert activities for all referrals of this trainer
    INSERT INTO trainer_hebat_activities (
        trainer_id,
        category,
        activity_type,
        description,
        points,
        metadata
    )
    SELECT 
        rt.trainer_id,
        'B',
        'referral',
        'Referral registered',
        2, -- 2 Points per GTK
        jsonb_build_object('referral_id', rt.id, 'referral_type', 'GTK')
    FROM referral_tracking rt
    WHERE rt.trainer_id = v_trainer_id
    AND NOT EXISTS (
        SELECT 1 FROM trainer_hebat_activities tha 
        WHERE tha.metadata->>'referral_id' = rt.id::text
    );

    -- 3. Update Points Summary
    INSERT INTO trainer_hebat_points (trainer_id, b_points, total_points)
    VALUES (
        v_trainer_id,
        (SELECT COALESCE(SUM(points), 0) FROM trainer_hebat_activities WHERE trainer_id = v_trainer_id AND category = 'B'),
        (SELECT COALESCE(SUM(points), 0) FROM trainer_hebat_activities WHERE trainer_id = v_trainer_id)
    )
    ON CONFLICT (trainer_id) DO UPDATE SET
        b_points = EXCLUDED.b_points,
        total_points = EXCLUDED.total_points,
        updated_at = NOW();

END $$;

-- Verify Results for BOTH accounts
SELECT 
    t.name,
    t.email,
    thp.b_points as berbagi_points,
    thp.total_points,
    (SELECT count(*) FROM referral_tracking rt WHERE rt.trainer_id = t.id) as actual_referrals
FROM trainers t
LEFT JOIN trainer_hebat_points thp ON thp.trainer_id = t.id
WHERE t.id IN ('42b63c7d-40fa-4b23-9be2-55b4dad1d97c', 'd0954ef1-30c7-4360-be95-7207988c4bd3');
