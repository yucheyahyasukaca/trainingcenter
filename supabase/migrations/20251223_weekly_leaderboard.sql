-- Function to get weekly leaderboard
-- Returns top trainers based on points earned in the current week (starting Monday)

CREATE OR REPLACE FUNCTION get_weekly_leaderboard(
    limit_count INTEGER DEFAULT 10,
    offset_num INTEGER DEFAULT 0
)
RETURNS TABLE (
    trainer_id UUID,
    name TEXT,
    avatar_url TEXT,
    specialization TEXT,
    weekly_points BIGINT,
    rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH weekly_scores AS (
        SELECT 
            tha.trainer_id,
            SUM(tha.points) as total_points
        FROM 
            trainer_hebat_activities tha
        WHERE 
            tha.created_at >= date_trunc('week', NOW()) -- Current week starting Monday
        GROUP BY 
            tha.trainer_id
    )
    SELECT 
        ws.trainer_id,
        t.name,
        t.avatar_url,
        t.specialization,
        ws.total_points as weekly_points,
        RANK() OVER (ORDER BY ws.total_points DESC) as rank
    FROM 
        weekly_scores ws
    JOIN 
        trainers t ON ws.trainer_id = t.id
    ORDER BY 
        ws.total_points DESC
    LIMIT 
        limit_count
    OFFSET 
        offset_num;
END;
$$ LANGUAGE plpgsql;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_weekly_leaderboard(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_leaderboard(INTEGER, INTEGER) TO service_role;

-- Comment for documentation
COMMENT ON FUNCTION get_weekly_leaderboard IS 'Returns top trainers ranked by points earned in the current week';
