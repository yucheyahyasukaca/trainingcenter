-- Force Activate Referral Code MQHSK1JZ (FINAL v3)
-- Program: Gemini untuk Pendidik (9712d177-5cf4-4ed2-8e66-f871affb0549)
-- Schema corrected based on user screenshots

DO $$
DECLARE
    v_code TEXT := 'MQHSK1JZ';
    v_program_id UUID := '9712d177-5cf4-4ed2-8e66-f871affb0549';
    v_trainer_id UUID;
    v_referral_id UUID;
    v_discount_amount NUMERIC;
    v_user_email TEXT;
    v_user_id UUID;
    v_participant_id UUID;
    v_enrollment_id UUID;
    
    -- List of emails
    v_user_emails TEXT[] := ARRAY[
        'yuchesukaca96@guru.sma.belajar.id',
        'hamka45@guru.sma.belajar.id',
        'dinisusilowati10@guru.sma.belajar.id'
    ];
BEGIN
    -- 1. Get Referral Info
    SELECT id, trainer_id, discount_amount 
    INTO v_referral_id, v_trainer_id, v_discount_amount
    FROM referral_codes 
    WHERE code = v_code;

    IF v_referral_id IS NULL THEN
        RAISE EXCEPTION 'Referral code % not found', v_code;
    END IF;

    RAISE NOTICE 'Processing Code: % | Trainer: %', v_code, v_trainer_id;

    -- 2. Loop
    FOREACH v_user_email IN ARRAY v_user_emails
    LOOP
        RAISE NOTICE '---------------------------------------------------';
        RAISE NOTICE 'Processing User: %', v_user_email;

        -- Get User
        SELECT id INTO v_user_id FROM user_profiles WHERE email = v_user_email;
        IF v_user_id IS NULL THEN
            RAISE NOTICE 'User profile not found: %', v_user_email;
            CONTINUE;
        END IF;

        -- Ensure Participant
        SELECT id INTO v_participant_id FROM participants WHERE user_id = v_user_id;
        IF v_participant_id IS NULL THEN
            RAISE NOTICE 'Creating Participant...';
            INSERT INTO participants (user_id, name, email, phone, address, status, created_at, updated_at)
            SELECT id, full_name, email, '-', '-', 'active', NOW(), NOW()
            FROM user_profiles WHERE id = v_user_id
            RETURNING id INTO v_participant_id;
        END IF;

        -- Ensure Enrollment (Corrected Schema)
        SELECT id INTO v_enrollment_id 
        FROM enrollments 
        WHERE participant_id = v_participant_id AND program_id = v_program_id;

        IF v_enrollment_id IS NULL THEN
            RAISE NOTICE 'Creating Enrollment...';
            INSERT INTO enrollments (
                participant_id, 
                program_id, 
                status, 
                payment_status, 
                amount_paid,        -- Corrected
                referral_discount,  -- Corrected
                final_price,        -- Corrected 
                referral_code,      -- Corrected
                referral_code_id,   -- Corrected
                referred_by_trainer_id, -- Corrected
                enrollment_date,    -- Corrected
                created_at, 
                updated_at, 
                notes,
                user_id
            )
            VALUES (
                v_participant_id, 
                v_program_id, 
                'approved', 
                'paid', 
                0, -- amount_paid (Free)
                0, -- referral_discount
                0, -- final_price (Free)
                v_code,
                v_referral_id,
                v_trainer_id,
                NOW(), -- enrollment_date
                NOW(), 
                NOW(), 
                'Force Activated Referral ' || v_code,
                v_user_id
            )
            RETURNING id INTO v_enrollment_id;
        ELSE
            RAISE NOTICE 'Enrollment exists. Updating referral info if missing...';
            -- Update existing enrollment with referral info if empty
            UPDATE enrollments 
            SET referral_code = v_code,
                referral_code_id = v_referral_id,
                referred_by_trainer_id = v_trainer_id
            WHERE id = v_enrollment_id 
            AND referral_code IS NULL;
        END IF;

        -- Ensure Referral Tracking (Still needed for specific dashboard stats usually)
        IF NOT EXISTS (SELECT 1 FROM referral_tracking WHERE enrollment_id = v_enrollment_id) THEN
            RAISE NOTICE 'Creating Referral Tracking...';
            INSERT INTO referral_tracking (
                referral_code_id, trainer_id, participant_id, enrollment_id, 
                program_id, discount_applied, status, created_at
            )
            VALUES (
                v_referral_id, v_trainer_id, v_participant_id, v_enrollment_id,
                v_program_id, 0, 'confirmed', NOW()
            );
            RAISE NOTICE 'SUCCESS: Referral Activated!';
        ELSE
            RAISE NOTICE 'Referral Tracking already exists.';
        END IF;

    END LOOP;

END $$;
