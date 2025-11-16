-- ============================================================================
-- FIX SPECIFIC USER ENROLLMENT - Yuche Yahya Sukaca
-- ============================================================================

-- 1. Cari user profile berdasarkan email
SELECT 
    id as user_id,
    email,
    full_name,
    role,
    trainer_level
FROM user_profiles
WHERE email = 'yucheyahya@gmail.com';

-- 2. Cari participant record
SELECT 
    pa.id as participant_id,
    pa.user_id,
    pa.name,
    pa.email
FROM participants pa
JOIN user_profiles up ON up.id = pa.user_id
WHERE up.email = 'yucheyahya@gmail.com';

-- 3. Lihat semua enrollment user ini
SELECT 
    e.id as enrollment_id,
    e.status as current_status,
    e.payment_status,
    e.certificate_issued,
    e.created_at,
    p.id as program_id,
    p.title as program_title,
    p.price,
    p.program_type
FROM enrollments e
JOIN participants pa ON pa.id = e.participant_id
JOIN user_profiles up ON up.id = pa.user_id
JOIN programs p ON p.id = e.program_id
WHERE up.email = 'yucheyahya@gmail.com'
ORDER BY e.created_at DESC;

-- 4. UPDATE: Fix semua enrollment user ini yang statusnya NULL atau kosong
UPDATE enrollments
SET 
    status = CASE
        -- Jika certificate issued, set completed
        WHEN enrollments.certificate_issued = TRUE THEN 'completed'
        -- Jika payment_status paid, set approved
        WHEN enrollments.payment_status = 'paid' THEN 'approved'
        -- Jika program gratis, set approved
        WHEN p.price = 0 THEN 'approved'
        -- Default pending
        ELSE 'pending'
    END,
    updated_at = NOW()
FROM participants pa
JOIN user_profiles up ON up.id = pa.user_id
JOIN programs p ON p.id = enrollments.program_id
WHERE enrollments.participant_id = pa.id
  AND up.email = 'yucheyahya@gmail.com'
  AND (enrollments.status IS NULL OR enrollments.status = '');

-- 5. Verify hasil update
SELECT 
    e.id as enrollment_id,
    e.status as NEW_status,
    e.payment_status,
    e.certificate_issued,
    p.title as program_title,
    p.price
FROM enrollments e
JOIN participants pa ON pa.id = e.participant_id
JOIN user_profiles up ON up.id = pa.user_id
JOIN programs p ON p.id = e.program_id
WHERE up.email = 'yucheyahya@gmail.com'
ORDER BY e.updated_at DESC;

