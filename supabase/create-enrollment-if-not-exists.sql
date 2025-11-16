-- ============================================================================
-- COMPREHENSIVE FIX: Buat enrollment jika tidak ada
-- ============================================================================

-- 1. Cek user dan participant
SELECT 'Step 1: User Check' as step;
SELECT 
    up.id as user_id,
    up.email,
    up.full_name,
    pa.id as participant_id
FROM user_profiles up
LEFT JOIN participants pa ON pa.user_id = up.id
WHERE up.email = 'yucheyahya@gmail.com';

-- 2. Jika participant belum ada, buat (uncomment jika perlu)
-- INSERT INTO participants (user_id, name, email, phone, status)
-- SELECT 
--     id as user_id,
--     full_name as name,
--     email,
--     '' as phone,
--     'active' as status
-- FROM user_profiles
-- WHERE email = 'yucheyahya@gmail.com'
-- ON CONFLICT (user_id) DO NOTHING;

-- 3. Cek enrollment yang ada
SELECT 'Step 3: Current Enrollments' as step;
SELECT 
    e.id,
    e.status,
    e.payment_status,
    p.title,
    p.id as program_id
FROM enrollments e
JOIN programs p ON p.id = e.program_id
JOIN participants pa ON pa.id = e.participant_id
JOIN user_profiles up ON up.id = pa.user_id
WHERE up.email = 'yucheyahya@gmail.com';

-- 4. Jika tidak ada enrollment, buat enrollment untuk program Gemini (uncomment jika perlu)
SELECT 'Step 4: Available Programs to Enroll' as step;
SELECT 
    p.id,
    p.title,
    p.price
FROM programs p
WHERE p.title ILIKE '%gemini%'
  AND p.status = 'published';

-- 5. CREATE ENROLLMENT (JALANKAN INI JIKA ENROLLMENT TIDAK ADA)
-- Ganti <PARTICIPANT_ID> dengan ID dari Step 1
-- Ganti <PROGRAM_ID> dengan ID dari Step 4

/*
INSERT INTO enrollments (
    program_id,
    participant_id,
    status,
    payment_status,
    amount_paid,
    enrollment_date,
    notes
)
VALUES (
    '9712d177-5cf4-4ed2-8e66-f871affb0549', -- Program ID (Gemini untuk Pendidik)
    '<PARTICIPANT_ID>', -- Ganti dengan participant ID dari Step 1
    'approved', -- Status
    'paid', -- Payment status
    0, -- Amount paid
    NOW(), -- Enrollment date
    'Created manually via SQL'
)
ON CONFLICT (program_id, participant_id) 
DO UPDATE SET 
    status = 'approved',
    payment_status = 'paid',
    updated_at = NOW();
*/

-- 6. Verify final result
SELECT 'Step 6: Final Check' as step;
SELECT 
    e.id,
    e.status,
    e.payment_status,
    p.title,
    pa.email
FROM enrollments e
JOIN programs p ON p.id = e.program_id
JOIN participants pa ON pa.id = e.participant_id
WHERE pa.email = 'yucheyahya@gmail.com';

