-- Enhanced Leaderboard Function
-- Supports 'week', 'month', 'year', and 'all_time' periods
-- 'all_time' uses the pre-aggregated table for performance

CREATE OR REPLACE FUNCTION get_leaderboard(
    period_type TEXT DEFAULT 'week',
    limit_count INTEGER DEFAULT 10,
    offset_num INTEGER DEFAULT 0
)
RETURNS TABLE (
    trainer_id UUID,
    name TEXT,
    avatar_url TEXT,
    specialization TEXT,
    total_points BIGINT,
    rank BIGINT
) AS $$
DECLARE
    start_date TIMESTAMPTZ;
BEGIN
    -- Optimization for 'all_time': use the summary table directly
    IF period_type = 'all_time' THEN
        RETURN QUERY
        SELECT 
            thp.trainer_id,
            t.name::TEXT,
            t.avatar_url::TEXT,
            t.specialization::TEXT,
            thp.total_points::BIGINT,
            RANK() OVER (ORDER BY thp.total_points DESC) as rank
        FROM 
            trainer_hebat_points thp
        JOIN 
            trainers t ON thp.trainer_id = t.id
        ORDER BY 
            thp.total_points DESC
        LIMIT 
            limit_count
        OFFSET 
            offset_num;
        RETURN;
    END IF;

    -- For time-based periods, calculate from activity history
    IF period_type = 'week' THEN
        start_date := date_trunc('week', NOW());
    ELSIF period_type = 'month' THEN
        start_date := date_trunc('month', NOW());
    ELSIF period_type = 'year' THEN
        start_date := date_trunc('year', NOW());
    ELSE
        -- Fallback to all time behavior using activities if weird parameter passed
        start_date := '2000-01-01'::TIMESTAMPTZ; 
    END IF;

    RETURN QUERY
    WITH scores AS (
        SELECT 
            tha.trainer_id,
            SUM(tha.points) as score
        FROM 
            trainer_hebat_activities tha
        WHERE 
            tha.created_at >= start_date
        GROUP BY 
            tha.trainer_id
    )
    SELECT 
        s.trainer_id,
        t.name::TEXT,
        t.avatar_url::TEXT,
        t.specialization::TEXT,
        s.score as total_points,
        RANK() OVER (ORDER BY s.score DESC) as rank
    FROM 
        scores s
    JOIN 
        trainers t ON s.trainer_id = t.id
    ORDER BY 
        s.score DESC
    LIMIT 
        limit_count
    OFFSET 
        offset_num;
END;
$$ LANGUAGE plpgsql;

-- Grant access
GRANT EXECUTE ON FUNCTION get_leaderboard(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard(TEXT, INTEGER, INTEGER) TO service_role;
