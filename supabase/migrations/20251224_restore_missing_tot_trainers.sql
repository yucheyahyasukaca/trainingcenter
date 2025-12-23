-- Migration to restore missing TOT enrollments and trainer records
-- Based on determining users who have completed >= 35 items of the TOT class content.

DO $$
DECLARE
    v_class_id UUID;
    v_program_id UUID;
    v_total_contents BIGINT;
    r RECORD;
    v_participant_id UUID;
    v_enrollment_id UUID;
    v_restored_count INTEGER := 0;
BEGIN
    -- 1. Get TOT Class ID AND Program ID
    -- We assume classes table has program_id. If not, this block will fail, but standard schema implies it.
    SELECT id, program_id INTO v_class_id, v_program_id
    FROM classes
    WHERE name ILIKE '%TOT%'
    LIMIT 1;

    IF v_class_id IS NULL THEN
        RAISE NOTICE 'TOT Class not found';
        RETURN;
    END IF;

    -- 2. Count total published contents
    SELECT COUNT(*) INTO v_total_contents
    FROM learning_contents
    WHERE class_id = v_class_id
    AND status = 'published';

    RAISE NOTICE 'TOT Class ID: %, Program ID: %, Total Contents: %', v_class_id, v_program_id, v_total_contents;

    -- 3. Loop through candidates (users with >= v_total_contents - 5 progress)
    FOR r IN 
        WITH user_progress AS (
            SELECT lp.user_id, COUNT(lp.id) as completion_count
            FROM learning_progress lp
            JOIN learning_contents lc ON lc.id = lp.content_id
            WHERE lc.class_id = v_class_id
            AND lc.status = 'published'
            AND lp.status = 'completed'
            GROUP BY lp.user_id
        )
        SELECT 
            u_prog.user_id,
            p.full_name,
            p.email,
            u_prog.completion_count
        FROM user_progress u_prog
        JOIN user_profiles p ON p.id = u_prog.user_id
        LEFT JOIN trainers t ON t.user_id = u_prog.user_id
        LEFT JOIN participants part ON part.user_id = u_prog.user_id
        -- We join enrollments by program_id and participant_id because that's the unique constraint, 
        -- assuming the class belongs to this program.
        LEFT JOIN enrollments e ON e.participant_id = part.id AND e.program_id = v_program_id
        WHERE u_prog.completion_count >= (v_total_contents - 5)
        AND (
            p.role != 'trainer' OR 
            t.id IS NULL OR 
            e.status IS NULL OR 
            e.status != 'completed'
        )
    LOOP
        RAISE NOTICE 'Restoring User: % (ID: %, Progress: %)', r.full_name, r.user_id, r.completion_count;

        -- A. Ensure Participant Record Exists
        SELECT id INTO v_participant_id FROM participants WHERE user_id = r.user_id;

        IF v_participant_id IS NULL THEN
            INSERT INTO participants (user_id, created_at, updated_at)
            VALUES (r.user_id, NOW(), NOW())
            RETURNING id INTO v_participant_id;
            RAISE NOTICE '  -> Created Participant Record: %', v_participant_id;
        END IF;

        -- B. Ensure Enrollment Record Exists & Marked Completed
        -- Check by program_id and participant_id (Unique Constraint)
        SELECT id INTO v_enrollment_id FROM enrollments 
        WHERE participant_id = v_participant_id AND program_id = v_program_id;

        IF v_enrollment_id IS NULL THEN
            INSERT INTO enrollments (
                program_id, 
                class_id, 
                participant_id, 
                status, 
                created_at, 
                updated_at
            )
            VALUES (
                v_program_id, 
                v_class_id, 
                v_participant_id, 
                'completed', 
                NOW(), 
                NOW()
            )
            RETURNING id INTO v_enrollment_id;
            RAISE NOTICE '  -> Created New Completed Enrollment: %', v_enrollment_id;
        ELSE
            -- Update existing enrollment to ensure class_id is set and status is completed
            UPDATE enrollments
            SET status = 'completed', 
                class_id = v_class_id, 
                updated_at = NOW()
            WHERE id = v_enrollment_id AND (status != 'completed' OR class_id IS DISTINCT FROM v_class_id);
            RAISE NOTICE '  -> Updated Existing Enrollment to Completed: %', v_enrollment_id;
        END IF;

        -- C. Update User Role
        UPDATE user_profiles
        SET role = 'trainer'
        WHERE id = r.user_id;

        -- D. Insert Trainer Record
        INSERT INTO trainers (
            user_id,
            name,
            email,
            created_at,
            updated_at,
            specialization,
            experience_years,
            phone
        )
        VALUES (
            r.user_id,
            r.full_name,
            r.email,
            NOW(),
            NOW(),
            'General',
            1,
            '-' -- Default
        )
        ON CONFLICT (user_id) DO NOTHING;

        v_restored_count := v_restored_count + 1;
        
    END LOOP;

    RAISE NOTICE 'Total Users Restored: %', v_restored_count;

END $$;
