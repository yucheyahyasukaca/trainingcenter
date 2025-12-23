-- Verify points totals
SELECT 
    t.email,
    thp.b_points,
    thp.total_points,
    (SELECT COUNT(*) FROM referral_tracking rt WHERE rt.trainer_id = t.id) as referral_count,
    (SELECT COUNT(*) FROM trainer_hebat_activities tha WHERE tha.trainer_id = t.id AND tha.category = 'B' AND tha.activity_type = 'referral') as activity_count
FROM trainer_hebat_points thp
JOIN trainers t ON t.id = thp.trainer_id
ORDER BY thp.b_points DESC;
