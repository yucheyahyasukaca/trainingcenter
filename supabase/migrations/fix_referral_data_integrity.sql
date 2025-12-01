-- Comprehensive Fix for Referral Data and Points
-- Target Account: d0954ef1-30c7-4360-be95-7207988c4bd3

DO $$
DECLARE
    v_trainer_id UUID := 'd0954ef1-30c7-4360-be95-7207988c4bd3';
    v_user_record RECORD;
BEGIN
    -- 1. FIX DATA INTEGRITY: Sync trainer_id in referral_tracking
    -- Some referral_tracking records might have NULL trainer_id or incorrect one.
    -- We trust the referral_codes table as the source of truth for ownership.
    
    UPDATE referral_tracking rt
    SET trainer_id = rc.trainer_id
    FROM referral_codes rc
    WHERE rt.referral_code_id = rc.id
    AND (rt.trainer_id IS NULL OR rt.trainer_id != rc.trainer_id);

    -- 2. ENSURE TRAINER EXISTS
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
        -- Fallback
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

    -- 3. BACKFILL ACTIVITIES (POINTS)
    -- Now that referral_tracking.trainer_id is fixed, we can backfill activities
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

    -- 4. UPDATE POINTS SUMMARY
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

-- Verify Results
SELECT 
    t.name,
    thp.b_points as berbagi_points,
    thp.total_points,
    (SELECT count(*) FROM referral_tracking WHERE trainer_id = 'd0954ef1-30c7-4360-be95-7207988c4bd3') as actual_referrals_in_tracking,
    (SELECT count(*) FROM referral_codes rc JOIN referral_tracking rt ON rt.referral_code_id = rc.id WHERE rc.trainer_id = 'd0954ef1-30c7-4360-be95-7207988c4bd3') as referrals_via_code
FROM trainers t
LEFT JOIN trainer_hebat_points thp ON thp.trainer_id = t.id
WHERE t.id = 'd0954ef1-30c7-4360-be95-7207988c4bd3';
