-- Function to get optimized referral leaderboard
-- Replaces the slow application-side aggregation

CREATE OR REPLACE FUNCTION get_referral_leaderboard(
    p_period TEXT DEFAULT 'all',
    p_search TEXT DEFAULT '',
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    trainer_id UUID,
    trainer_name TEXT,
    trainer_email TEXT,
    total_referrals BIGINT,
    confirmed_referrals BIGINT,
    pending_referrals BIGINT,
    cancelled_referrals BIGINT,
    total_commission_earned NUMERIC,
    confirmed_commission NUMERIC,
    conversion_rate NUMERIC,
    active_referral_codes BIGINT,
    total_referral_codes BIGINT,
    last_referral_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date TIMESTAMPTZ;
BEGIN
    -- Determine start date based on period
    IF p_period = 'week' THEN
        v_start_date := NOW() - INTERVAL '1 week';
    ELSIF p_period = 'month' THEN
        v_start_date := NOW() - INTERVAL '1 month';
    ELSIF p_period = 'year' THEN
        v_start_date := NOW() - INTERVAL '1 year';
    ELSE
        v_start_date := '2000-01-01'::TIMESTAMPTZ; -- All time
    END IF;

    RETURN QUERY
    WITH trainer_stats AS (
        SELECT
            rc.trainer_id,
            COUNT(e.id) FILTER (WHERE e.created_at >= v_start_date) as total_refs,
            COUNT(e.id) FILTER (WHERE e.status = 'approved' AND e.created_at >= v_start_date) as confirmed_refs,
            COUNT(e.id) FILTER (WHERE e.status = 'pending' AND e.created_at >= v_start_date) as pending_refs,
            COUNT(e.id) FILTER (WHERE e.status = 'cancelled' AND e.created_at >= v_start_date) as cancelled_refs,
            MAX(e.created_at) FILTER (WHERE e.created_at >= v_start_date) as last_ref_date,
            -- Commission calculation (placeholder logic, adjust if commission is tracked elsewhere)
            0::NUMERIC as total_comm, 
            0::NUMERIC as confirmed_comm
        FROM referral_codes rc
        LEFT JOIN enrollments e ON e.referral_code_id = rc.id
        GROUP BY rc.trainer_id
    ),
    code_stats AS (
        SELECT
            rc.trainer_id,
            COUNT(*) as total_codes,
            COUNT(*) FILTER (WHERE rc.is_active = true) as active_codes
        FROM referral_codes rc
        GROUP BY rc.trainer_id
    )
    SELECT
        p.id as trainer_id,
        p.full_name as trainer_name,
        p.email as trainer_email,
        COALESCE(ts.total_refs, 0) as total_referrals,
        COALESCE(ts.confirmed_refs, 0) as confirmed_referrals,
        COALESCE(ts.pending_refs, 0) as pending_referrals,
        COALESCE(ts.cancelled_refs, 0) as cancelled_referrals,
        COALESCE(ts.total_comm, 0) as total_commission_earned,
        COALESCE(ts.confirmed_comm, 0) as confirmed_commission,
        CASE 
            WHEN COALESCE(ts.total_refs, 0) > 0 THEN 
                ROUND((COALESCE(ts.confirmed_refs, 0)::NUMERIC / ts.total_refs::NUMERIC) * 100, 1)
            ELSE 0 
        END as conversion_rate,
        COALESCE(cs.active_codes, 0) as active_referral_codes,
        COALESCE(cs.total_codes, 0) as total_referral_codes,
        ts.last_ref_date as last_referral_date
    FROM user_profiles p
    JOIN code_stats cs ON p.id = cs.trainer_id
    LEFT JOIN trainer_stats ts ON p.id = ts.trainer_id
    WHERE 
        (p_search = '' OR 
         p.full_name ILIKE '%' || p_search || '%' OR 
         p.email ILIKE '%' || p_search || '%')
    ORDER BY 
        COALESCE(ts.confirmed_refs, 0) DESC,
        COALESCE(ts.total_refs, 0) DESC,
        p.full_name ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;
