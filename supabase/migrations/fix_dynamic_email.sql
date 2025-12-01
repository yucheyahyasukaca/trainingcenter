-- Dynamic Fix Script using Email Lookup
-- Target Email: yucheyahya@gmail.com

DO $$
DECLARE
    v_correct_trainer_id UUID;
    v_wrong_trainer_id UUID := 'd0954ef1-30c7-4360-be95-7207988c4b5a'; -- The one found in tracking
BEGIN
    -- 1. Find the CORRECT ID from user_profiles using email
    SELECT id INTO v_correct_trainer_id
    FROM user_profiles
    WHERE email = 'yucheyahya@gmail.com'
    LIMIT 1;

    IF v_correct_trainer_id IS NULL THEN
        RAISE EXCEPTION 'User with email yucheyahya@gmail.com not found in user_profiles';
    END IF;

    RAISE NOTICE 'Found correct trainer ID: %', v_correct_trainer_id;

    -- 2. Update referral_tracking to point to the correct ID
    -- Fix records pointing to the wrong ID
    UPDATE referral_tracking
    SET trainer_id = v_correct_trainer_id
    WHERE trainer_id = v_wrong_trainer_id;

    -- Fix records linked to his codes but having NULL or wrong trainer_id
    UPDATE referral_tracking rt
    SET trainer_id = v_correct_trainer_id
    FROM referral_codes rc
    WHERE rt.referral_code_id = rc.id
    AND rc.trainer_id = v_correct_trainer_id
    AND (rt.trainer_id IS NULL OR rt.trainer_id != v_correct_trainer_id);

    -- 3. Ensure Trainer Record Exists
    INSERT INTO trainers (id, name, email, created_at, updated_at, specialization, experience_years, phone)
    SELECT id, full_name, email, NOW(), NOW(), 'General', 0, '-'
    FROM user_profiles
    WHERE id = v_correct_trainer_id
    ON CONFLICT (id) DO NOTHING;

    -- 4. Recalculate Points
    -- Clear existing activities
    DELETE FROM trainer_hebat_activities 
    WHERE trainer_id = v_correct_trainer_id 
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
        v_correct_trainer_id,
        'B',
        'referral',
        'Referral registered',
        2, -- 2 Points per GTK
        jsonb_build_object('referral_id', rt.id, 'referral_type', 'GTK')
    FROM referral_tracking rt
    WHERE rt.trainer_id = v_correct_trainer_id;

    -- Update Summary
    INSERT INTO trainer_hebat_points (trainer_id, b_points, total_points)
    VALUES (
        v_correct_trainer_id,
        (SELECT COALESCE(SUM(points), 0) FROM trainer_hebat_activities WHERE trainer_id = v_correct_trainer_id AND category = 'B'),
        (SELECT COALESCE(SUM(points), 0) FROM trainer_hebat_activities WHERE trainer_id = v_correct_trainer_id)
    )
    ON CONFLICT (trainer_id) DO UPDATE SET
        b_points = EXCLUDED.b_points,
        total_points = EXCLUDED.total_points,
        updated_at = NOW();

END $$;

-- Verify Results
SELECT 
    t.name,
    t.email,
    thp.b_points as berbagi_points,
    thp.total_points,
    (SELECT count(*) FROM referral_tracking rt WHERE rt.trainer_id = t.id) as actual_referrals
FROM trainers t
LEFT JOIN trainer_hebat_points thp ON thp.trainer_id = t.id
WHERE t.email = 'yucheyahya@gmail.com';
