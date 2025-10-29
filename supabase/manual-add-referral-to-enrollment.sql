-- ============================================================================
-- MANUAL ADD REFERRAL CODE TO ENROLLMENT
-- ============================================================================
-- Script untuk menambahkan referral_code_id ke enrollment secara manual
-- Gunakan script ini jika Anda tahu referral_code_id yang seharusnya digunakan
-- ============================================================================

-- Step 1: Tampilkan semua referral codes yang tersedia
-- ============================================================================
SELECT 
    rc.id as referral_code_id,
    rc.code as referral_code_text,
    rc.trainer_id,
    up.full_name as trainer_name,
    rc.is_active,
    rc.current_uses,
    rc.created_at
FROM referral_codes rc
LEFT JOIN user_profiles up ON up.id = rc.trainer_id
ORDER BY rc.created_at DESC
LIMIT 20;

-- Step 2: Tampilkan enrollment yang perlu di-update
-- ============================================================================
SELECT 
    e.id as enrollment_id,
    e.participant_id,
    e.program_id,
    e.status,
    e.referral_code_id,
    e.notes,
    e.created_at,
    p.user_id,
    up.full_name as participant_name,
    up.email as participant_email
FROM enrollments e
LEFT JOIN participants p ON p.id = e.participant_id
LEFT JOIN user_profiles up ON up.id = p.user_id
WHERE e.id = 'f7689b12-5d0d-4902-b25a-7b7db882daef'  -- GANTI dengan enrollment_id dari console log
ORDER BY e.created_at DESC;

-- Step 3: Manual update enrollment dengan referral_code_id
-- ============================================================================
-- UNCOMMENT dan ganti dengan referral_code_id yang benar dari Step 1:
-- 
-- UPDATE enrollments
-- SET referral_code_id = 'REFERRAL_CODE_ID_DARI_STEP_1',
--     updated_at = NOW()
-- WHERE id = 'f7689b12-5d0d-4902-b25a-7b7db882daef';
--
-- Contoh jika referral_code_id-nya adalah 'abc-123-def':
-- UPDATE enrollments
-- SET referral_code_id = 'abc-123-def',
--     updated_at = NOW()
-- WHERE id = 'f7689b12-5d0d-4902-b25a-7b7db882daef';

-- Step 4: Setelah update, buat referral_tracking record (jika belum ada)
-- ============================================================================
-- UNCOMMENT dan sesuaikan dengan data yang benar:
--
-- INSERT INTO referral_tracking (
--     referral_code_id,
--     trainer_id,
--     participant_id,
--     enrollment_id,
--     program_id,
--     status,
--     discount_applied,
--     commission_earned
-- )
-- SELECT 
--     e.referral_code_id,  -- dari enrollment yang baru di-update
--     rc.trainer_id,       -- dari referral_codes
--     e.participant_id,    -- dari enrollment
--     e.id,                -- enrollment_id
--     e.program_id,        -- dari enrollment
--     CASE 
--         WHEN e.status = 'approved' THEN 'confirmed'
--         ELSE 'pending'
--     END as status,
--     0 as discount_applied,
--     0 as commission_earned
-- FROM enrollments e
-- JOIN referral_codes rc ON rc.id = e.referral_code_id
-- WHERE e.id = 'f7689b12-5d0d-4902-b25a-7b7db882daef'
-- AND NOT EXISTS (
--     SELECT 1 FROM referral_tracking rt 
--     WHERE rt.enrollment_id = e.id
-- );

-- Step 5: Verifikasi hasil
-- ============================================================================
SELECT 
    'After Update' as status,
    e.id as enrollment_id,
    e.referral_code_id,
    rc.code as referral_code_text,
    rt.id as tracking_id,
    rt.status as tracking_status
FROM enrollments e
LEFT JOIN referral_codes rc ON rc.id = e.referral_code_id
LEFT JOIN referral_tracking rt ON rt.enrollment_id = e.id
WHERE e.id = 'f7689b12-5d0d-4902-b25a-7b7db882daef';  -- GANTI dengan enrollment_id

-- ============================================================================
-- CARA PENGGUNAAN:
-- ============================================================================
-- 1. Jalankan Step 1 untuk melihat semua referral codes yang ada
-- 2. Jalankan Step 2 untuk melihat detail enrollment
-- 3. Jika Anda tahu referral_code_id yang benar, uncomment Step 3 dan ganti 
--    'REFERRAL_CODE_ID_DARI_STEP_1' dengan UUID referral code yang benar
-- 4. Uncomment Step 4 untuk membuat referral_tracking record
-- 5. Jalankan Step 5 untuk verifikasi
-- ============================================================================
