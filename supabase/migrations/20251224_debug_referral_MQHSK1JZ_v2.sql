-- Debug Referral Code MQHSK1JZ (View Results in Table)

-- 1. Check Referral Code & Trainer Status
-- Ini akan menampilkan detail pemilik kode dan apakah dia sudah terdaftar sebagai trainer
SELECT 
    'CODE INFO' as info_type,
    rc.code,
    up.email as trainer_email,
    up.full_name as trainer_name,
    CASE WHEN t.id IS NOT NULL THEN 'YES - Valid Trainer' ELSE 'NO - Not a Trainer' END as trainer_status,
    rc.created_at as code_created_at
FROM referral_codes rc
JOIN user_profiles up ON up.id = rc.trainer_id
LEFT JOIN trainers t ON t.user_id = rc.trainer_id
WHERE rc.code = 'MQHSK1JZ';

-- 2. Check Referral Usage (Tracking)
-- Ini menampilkan siapa saja yang sudah menggunakan kode ini
SELECT 
    'USAGE' as info_type,
    rt.status as referral_status,
    rt.created_at as used_at,
    COALESCE(p.name, up.full_name, 'Unknown') as participant_name,
    COALESCE(p.email, up.email, 'Unknown') as participant_email,
    e.status as enrollment_status,
    e.payment_status
FROM referral_tracking rt
LEFT JOIN participants p ON p.id = rt.participant_id
LEFT JOIN user_profiles up ON up.id = p.user_id
LEFT JOIN enrollments e ON e.id = rt.enrollment_id
WHERE rt.referral_code_id IN (SELECT id FROM referral_codes WHERE code = 'MQHSK1JZ');

-- 3. Check Points (HEBAT)
-- Ini menampilkan poin yang sudah masuk ke trainer
SELECT 
    'POINT' as info_type,
    tha.activity_type,
    tha.points,
    tha.description,
    tha.created_at
FROM trainer_hebat_activities tha
JOIN trainers t ON t.id = tha.trainer_id
JOIN referral_codes rc ON rc.trainer_id = t.user_id
WHERE rc.code = 'MQHSK1JZ'
AND tha.activity_type = 'referral';
