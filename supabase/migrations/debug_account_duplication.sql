-- Check for duplicate accounts and referral code ownership
-- Target Email: yucheyahya@gmail.com

-- 1. Check User Profiles for this email
SELECT '1. Profiles' as check_type, id, full_name, email, role
FROM user_profiles
WHERE email = 'yucheyahya@gmail.com';

-- 2. Check Trainers for this email
SELECT '2. Trainers' as check_type, id, name, email
FROM trainers
WHERE email = 'yucheyahya@gmail.com';

-- 3. Check Referral Codes owner for the code seen in the screenshot
-- Code ID from screenshot: 6e703180-28f9-48e5-b3ec-70c56e27519b
SELECT '3. Code Owner' as check_type, id, code, trainer_id
FROM referral_codes
WHERE id = '6e703180-28f9-48e5-b3ec-70c56e27519b';

-- 4. Check Referral Tracking for this code
SELECT '4. Tracking' as check_type, id, referral_code_id, trainer_id
FROM referral_tracking
WHERE referral_code_id = '6e703180-28f9-48e5-b3ec-70c56e27519b';
