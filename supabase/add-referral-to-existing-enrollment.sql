-- ============================================================================
-- ADD REFERRAL CODE TO EXISTING ENROLLMENT
-- ============================================================================
-- Script untuk menambahkan referral code ke enrollment yang sudah ada
-- Gunakan script ini jika enrollment dibuat tanpa referral code tapi seharusnya ada
-- ============================================================================

-- STEP 1: Lihat semua referral codes yang tersedia
-- ============================================================================
-- Jalankan ini dulu untuk melihat semua referral codes:
SELECT 
    rc.id as referral_code_id,
    rc.code as referral_code_text,
    rc.trainer_id,
    up.full_name as trainer_name,
    rc.is_active,
    rc.current_uses,
    rc.max_uses,
    rc.created_at
FROM referral_codes rc
LEFT JOIN user_profiles up ON up.id = rc.trainer_id
WHERE rc.is_active = true
ORDER BY rc.created_at DESC;

-- STEP 2: Update enrollment dengan referral_code_id
-- ============================================================================
-- SETELAH menemukan referral_code_id dari Step 1, UNCOMMENT dan ganti di bawah:
--
-- UPDATE enrollments
-- SET 
--     referral_code_id = 'REFERRAL_CODE_ID_DARI_STEP_1',
--     updated_at = NOW()
-- WHERE id = 'f7689b12-5d0d-4902-b25a-7b7db882daef'  -- enrollment_id dari console log
-- RETURNING id, referral_code_id;

-- Contoh:
-- UPDATE enrollments
-- SET 
--     referral_code_id = 'abc-123-def-456-ghi',
--     updated_at = NOW()
-- WHERE id = 'f7689b12-5d0d-4902-b25a-7b7db882daef';

-- STEP 3: Buat referral_tracking record
-- ============================================================================
-- SETELAH enrollment di-update di Step 2, UNCOMMENT dan jalankan ini:
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
--     e.referral_code_id,
--     rc.trainer_id,
--     e.participant_id,
--     e.id,
--     e.program_id,
--     CASE 
--         WHEN e.status = 'approved' THEN 'confirmed'
--         ELSE 'pending'
--     END as status,
--     COALESCE(e.referral_discount, 0) as discount_applied,
--     0 as commission_earned
-- FROM enrollments e
-- JOIN referral_codes rc ON rc.id = e.referral_code_id
-- WHERE e.id = 'f7689b12-5d0d-4902-b25a-7b7db882daef'  -- enrollment_id
-- AND e.referral_code_id IS NOT NULL
-- AND NOT EXISTS (
--     SELECT 1 FROM referral_tracking rt 
--     WHERE rt.enrollment_id = e.id
-- )
-- RETURNING id, enrollment_id, referral_code_id, status;

-- STEP 4: Verifikasi final
-- ============================================================================
-- Setelah semua update, cek hasil akhir:
SELECT 
    'Final Verification' as step,
    e.id as enrollment_id,
    e.referral_code_id,
    rc.code as referral_code_text,
    rt.id as tracking_id,
    rt.status as tracking_status,
    CASE 
        WHEN e.referral_code_id IS NOT NULL AND rt.id IS NOT NULL THEN 'COMPLETE'
        WHEN e.referral_code_id IS NOT NULL AND rt.id IS NULL THEN 'NEEDS TRACKING'
        ELSE 'NEEDS FIX'
    END as status
FROM enrollments e
LEFT JOIN referral_codes rc ON rc.id = e.referral_code_id
LEFT JOIN referral_tracking rt ON rt.enrollment_id = e.id
WHERE e.id = 'f7689b12-5d0d-4902-b25a-7b7db882daef';  -- enrollment_id

-- ============================================================================
-- CARA PENGGUNAAN:
-- ============================================================================
-- 1. Jalankan STEP 1 untuk melihat semua referral codes
-- 2. Pilih referral_code_id yang sesuai (yang digunakan oleh participant ini)
-- 3. UNCOMMENT dan jalankan STEP 2, ganti 'REFERRAL_CODE_ID_DARI_STEP_1'
-- 4. UNCOMMENT dan jalankan STEP 3 untuk membuat tracking record
-- 5. Jalankan STEP 4 rantai verifikasi
-- ============================================================================
