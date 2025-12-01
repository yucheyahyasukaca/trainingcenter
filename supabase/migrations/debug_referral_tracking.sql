-- Debug: Check referral_tracking trainer_id vs referral_codes trainer_id
-- Trainer ID: d0954ef1-30c7-4360-be95-7207988c4bd3

SELECT 
    rc.code,
    rc.trainer_id as code_owner_id,
    rt.id as tracking_id,
    rt.trainer_id as tracking_trainer_id,
    rt.status
FROM referral_codes rc
JOIN referral_tracking rt ON rt.referral_code_id = rc.id
WHERE rc.trainer_id = 'd0954ef1-30c7-4360-be95-7207988c4bd3';
