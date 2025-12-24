
DO $$
DECLARE
    v_code TEXT := 'MQHSK1JZ';
    v_trainer_id UUID;
    v_trainer_email TEXT;
    v_is_trainer BOOLEAN;
    v_tracking_count INTEGER;
    v_points_count INTEGER;
    r RECORD;
BEGIN
    -- 1. Get Trainer ID and Email from Referral Code
    SELECT trainer_id, p.email 
    INTO v_trainer_id, v_trainer_email
    FROM referral_codes rc
    JOIN user_profiles p ON p.id = rc.trainer_id
    WHERE rc.code = v_code;

    RAISE NOTICE 'Referral Code: %, Trainer ID: %, Email: %', v_code, v_trainer_id, v_trainer_email;

    IF v_trainer_id IS NULL THEN
        RAISE NOTICE 'Referral code not found!';
        RETURN;
    END IF;

    -- 2. Check if exists in trainers table
    SELECT EXISTS(SELECT 1 FROM trainers WHERE user_id = v_trainer_id) INTO v_is_trainer;
    
    RAISE NOTICE 'Is in trainers table: %', v_is_trainer;

    -- 3. Check referral tracking details
    RAISE NOTICE '--- Referral Tracking Details ---';
    FOR r IN 
        SELECT rt.id, rt.status, rt.created_at, e.payment_status, e.status as enrollment_status, up.email as participant_email
        FROM referral_tracking rt
        JOIN enrollments e ON e.id = rt.enrollment_id
        JOIN participants p ON p.id = rt.participant_id
        LEFT JOIN user_profiles up ON up.id = p.user_id
        WHERE rt.referral_code_id = (SELECT id FROM referral_codes WHERE code = v_code)
    LOOP
        RAISE NOTICE 'Tracking ID: %, Status: %, Created: %, Enrollment Status: %, Payment: %, Participant: %', 
            r.id, r.status, r.created_at, r.enrollment_status, r.payment_status, r.participant_email;
    END LOOP;

    -- 4. Check points in trainer_hebat_activities
    IF v_is_trainer THEN
        SELECT COUNT(*) INTO v_points_count
        FROM trainer_hebat_activities tha
        JOIN trainers t ON t.id = tha.trainer_id
        WHERE t.user_id = v_trainer_id
        AND tha.activity_type = 'referral';
        
        RAISE NOTICE 'Total referral points/activities in HEBAT: %', v_points_count;
    ELSE
        RAISE NOTICE 'User is NOT a trainer, so no points in trainer_hebat_activities.';
    END IF;

END $$;
