-- ============================================================================
-- QUICK FIX: UPDATE ENROLLMENT WITH REFERRAL_CODE_ID
-- ============================================================================
-- Script cepat untuk update enrollment dengan referral_code_id
-- ============================================================================

-- OPTION 1: Jika Anda TAHU referral_code_id (UUID)
-- ============================================================================
-- UNCOMMENT dan ganti dengan referral_code_id yang benar:
--
-- UPDATE enrollments
-- SET 
--     referral_code_id = 'REFERRAL_CODE_UUID_DISINI',
--     updated_at = NOW()
-- WHERE id = 'f7689b12-5d0d-4902-b25a-7b7db882daef';  -- enrollment_id dari console log

-- OPTION 2: Jika Anda TAHU referral code TEXTOUR (contoh: ABC123, XYZ789)
-- ============================================================================
-- UNCOMMENT dan ganti dengan referral code text:
--
-- UPDATE enrollments e
-- SET 
--     referral_code_id = rc.id,
--     updated_at = NOW()
-- FROM referral_codes rc
-- WHERE e.id = 'f7689b12-5d0d-4902-b25a-7b7db882daef'  -- enrollment_id
-- AND UPPER(TRIM(rc.code)) = UPPER(TRIM('REFERRAL_CODE_TEXT_DISINI'))  -- ganti dengan referral code text
-- AND rc.is_active = true
-- RETURNING e.id, e.referral_code_id, rc.code as referral_code_text;

-- OPTION 3: Jika Anda tidak tahu referral code-nya, lihat semua referral codes dulu
-- ============================================================================
SELECT 
    'List all referral codes' as info,
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
LIMIT 50;

-- Setelah menemukan referral_code_id dari query di atas, gunakan OPTION 1 untuk update

-- ============================================================================
-- SETELAH UPDATE ENROLLMENT, BUAT REFERRAL_TRACKING
-- ============================================================================
-- Setelah enrollment di-update dengan referral_code_id, jalankan ini untuk membuat tracking:

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
--     e.referral_code_id,
--     rc.trainer_id,
--     e.participant_id,
--     e.id,
--     e.program_id,
--     CASE 
--         WHEN e.status = 'approved' THEN 'confirmed'
--         ELSE 'pending'
--     END,
--     COALESCE(e.referral_discount, 0),
--     0
-- FROM enrollments e
-- JOIN referral_codes rc ON rc.id = e.referral_code_id
-- WHERE e.id = 'f7689b12-5d0d-4902-b25a-7b7db882daef'  -- enrollment_id
-- AND e.referral_code_id IS NOT NULL
-- AND NOT EXISTS (
--     SELECT 1 FROM referral_tracking rt 
--     WHERE rt.enrollment_id = e.id
-- );

-- ============================================================================
-- VERIFIKASI HASIL
-- ============================================================================
-- Setelah update, cek apakah sudah benar:
SELECT 
    e.id as enrollment_id,
    e.referral_code_id,
    rc.code as referral_code_text,
    rt.id as tracking_id,
    rt.status as tracking_status
FROM enrollments e
LEFT JOIN referral_codes rc ON rc.id = e.referral_code_id
LEFT JOIN referral_tracking rt ON rt.enrollment_id = e.id
WHERE e.id = 'f7689b12-5d0d-4902-b25a-7b7db882daef';  -- enrollment_id
