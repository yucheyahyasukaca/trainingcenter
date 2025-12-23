-- Migration to fix stuck TOT enrollments
-- Identifies enrollments that are 'approved' but have 100% progress
-- Updates them to 'completed', which triggers the auto-promotion to trainer

DO $$
DECLARE
    r RECORD;
    v_total_contents INTEGER;
    v_completed_contents INTEGER;
    v_updated_count INTEGER := 0;
BEGIN
    FOR r IN 
        SELECT e.id, e.class_id, e.participant_id, e.status
        FROM enrollments e
        JOIN classes c ON c.id = e.class_id
        WHERE e.status = 'approved'
        AND (c.name ILIKE '%TOT%' OR c.name ILIKE '%Training of Trainer%')
    LOOP
        -- 1. Count total published contents for this class
        SELECT COUNT(*) INTO v_total_contents
        FROM learning_contents
        WHERE class_id = r.class_id
        AND status = 'published';

        -- 2. Count completed progress for this enrollment
        -- relying on enrollment_id in learning_progress
        SELECT COUNT(*) INTO v_completed_contents
        FROM learning_progress
        WHERE enrollment_id = r.id
        AND status = 'completed';

        -- 3. Compare and Update if finished
        -- Note: We use >= just in case
        IF v_total_contents > 0 AND v_completed_contents >= v_total_contents THEN
            UPDATE enrollments
            SET status = 'completed', updated_at = NOW()
            WHERE id = r.id;
            
            v_updated_count := v_updated_count + 1;
            
            RAISE NOTICE 'Fixed stuck enrollment % (Progress: %/%)', r.id, v_completed_contents, v_total_contents;
        END IF;
    END LOOP;

    RAISE NOTICE 'Total stuck enrollments fixed: %', v_updated_count;
END $$;
