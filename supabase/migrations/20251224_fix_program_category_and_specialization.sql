-- Migration to fix Program category and re-apply trainer specialization
-- 1. Updates the TOT Program's category to 'Artificial Intelligence'
-- 2. Re-runs the trainer specialization update

DO $$
DECLARE
    v_class_id UUID;
    v_program_id UUID;
    r RECORD;
BEGIN
    -- 1. Identify the TOT Program
    SELECT id, program_id INTO v_class_id, v_program_id
    FROM classes
    WHERE name ILIKE '%TOT%'
    LIMIT 1;

    IF v_program_id IS NOT NULL THEN
        -- 2. Update Program Category
        UPDATE programs
        SET category = 'Artificial Intelligence',
            updated_at = NOW()
        WHERE id = v_program_id;
        
        RAISE NOTICE 'Updated Program % category to Artificial Intelligence', v_program_id;

        -- 3. Re-apply Trainer Specialization Update
        -- Find all trainers who completed this program
        FOR r IN 
            SELECT t.id as trainer_id, t.user_id
            FROM trainers t
            JOIN participants part ON part.user_id = t.user_id
            JOIN enrollments e ON e.participant_id = part.id
            WHERE e.program_id = v_program_id
            AND e.status = 'completed'
        LOOP
            UPDATE trainers
            SET specialization = 'Artificial Intelligence',
                updated_at = NOW()
            WHERE id = r.trainer_id;
            
            RAISE NOTICE 'Fixed trainer % specialization to Artificial Intelligence', r.trainer_id;
        END LOOP;
    END IF;
END $$;
