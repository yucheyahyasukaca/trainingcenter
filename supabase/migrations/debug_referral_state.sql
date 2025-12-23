-- Check triggers on referral_tracking
SELECT 
    event_object_schema as table_schema,
    event_object_table as table_name,
    trigger_schema,
    trigger_name,
    string_agg(event_manipulation, ',') as event,
    action_timing as activation,
    action_statement as definition
FROM information_schema.triggers
WHERE event_object_table = 'referral_tracking'
GROUP BY 1,2,3,4,6,7;

-- Check triggers on trainer_hebat_activities
SELECT 
    event_object_schema as table_schema,
    event_object_table as table_name,
    trigger_schema,
    trigger_name,
    string_agg(event_manipulation, ',') as event,
    action_timing as activation,
    action_statement as definition
FROM information_schema.triggers
WHERE event_object_table = 'trainer_hebat_activities'
GROUP BY 1,2,3,4,6,7;

-- Check for referrals without activities
SELECT count(*) as referrals_without_points
FROM referral_tracking rt
WHERE NOT EXISTS (
    SELECT 1 
    FROM trainer_hebat_activities tha 
    WHERE tha.metadata->>'referral_id' = rt.id::text
);

-- Check for point discrepancies
SELECT 
    thp.trainer_id,
    thp.b_points as recorded_b_points,
    (
        SELECT COALESCE(SUM(points), 0)
        FROM trainer_hebat_activities tha
        WHERE tha.trainer_id = thp.trainer_id AND tha.category = 'B'
    ) as calculated_b_points
FROM trainer_hebat_points thp
WHERE thp.b_points != (
    SELECT COALESCE(SUM(points), 0)
    FROM trainer_hebat_activities tha
    WHERE tha.trainer_id = thp.trainer_id AND tha.category = 'B'
);
