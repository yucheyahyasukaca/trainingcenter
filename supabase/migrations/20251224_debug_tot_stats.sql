-- Function to find users who completed TOT but are not trainers
-- Returns their details to help debug missing enrollments

CREATE OR REPLACE FUNCTION get_tot_missed_trainers()
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    role TEXT,
    progress_count BIGINT,
    total_contents BIGINT,
    enrollment_status TEXT,
    has_trainer_record BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as superuser/creator, bypassing RLS
AS $$
DECLARE
    v_class_id UUID;
    v_total_contents BIGINT;
BEGIN
    -- 1. Get TOT Class ID
    SELECT id INTO v_class_id
    FROM classes
    WHERE name ILIKE '%TOT%'
    LIMIT 1;

    IF v_class_id IS NULL THEN
        RETURN;
    END IF;

    -- 2. Count total published contents
    SELECT COUNT(*) INTO v_total_contents
    FROM learning_contents
    WHERE class_id = v_class_id
    AND status = 'published';

    -- 3. Return candidates
    RETURN QUERY
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
        up.user_id,
        p.full_name,
        p.role,
        u_prog.completion_count,
        v_total_contents,
        COALESCE(e.status, 'MISSING'),
        (t.id IS NOT NULL)
    FROM user_progress u_prog
    JOIN user_profiles p ON p.id = u_prog.user_id
    LEFT JOIN participants part ON part.user_id = u_prog.user_id
    LEFT JOIN enrollments e ON e.participant_id = part.id AND e.class_id = v_class_id
    LEFT JOIN trainers t ON t.user_id = u_prog.user_id
    WHERE u_prog.completion_count >= (v_total_contents - 2) -- Allow small margin error (e.g. 38/40)
    AND (
        p.role != 'trainer' OR 
        t.id IS NULL OR 
        e.status IS NULL OR 
        e.status != 'completed'
    )
    ORDER BY u_prog.completion_count DESC;

END;
$$;

-- Grant access to public/anon/authenticated
GRANT EXECUTE ON FUNCTION get_tot_missed_trainers() TO anon, authenticated, service_role;
