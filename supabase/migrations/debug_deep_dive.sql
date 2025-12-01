-- Deep Dive Debug for Trainer: d0954ef1-30c7-4360-be95-7207988c4bd3

-- 1. Check Referral Codes for this trainer
SELECT '1. Referral Codes' as check_type, id, code, trainer_id, is_active
FROM referral_codes
WHERE trainer_id = 'd0954ef1-30c7-4360-be95-7207988c4bd3';

-- 2. Check Referral Tracking for ANY code (limit 5) to see structure
SELECT '2. Sample Tracking' as check_type, id, referral_code_id, trainer_id, status
FROM referral_tracking
LIMIT 5;

-- 3. Check if there are ANY tracking records linked to the codes found in step 1
SELECT '3. Linked Tracking' as check_type, rt.id, rt.status, rt.referral_code_id
FROM referral_tracking rt
WHERE rt.referral_code_id IN (
    SELECT id FROM referral_codes WHERE trainer_id = 'd0954ef1-30c7-4360-be95-7207988c4bd3'
);

-- 4. Check View Output directly for this specific ID
SELECT '4. View Output' as check_type, *
FROM trainer_referral_stats
WHERE trainer_id = 'd0954ef1-30c7-4360-be95-7207988c4bd3';
