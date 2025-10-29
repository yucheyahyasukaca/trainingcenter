-- ============================================================================
-- EXTRACT AND FIX REFERRAL FROM ENROLLMENT NOTES
-- ============================================================================
-- Script untuk mengekstrak referral code dari notes enrollment dan memperbaikinya
-- ============================================================================

-- Step 1: Cek enrollment untuk participant ini (lihat notes lengkap)
-- ============================================================================
-- GANTI enrollment_id dengan enrollment_id dari console log: f7689b12-5d0d-4902-b25a-7b7db882daef
SELECT 
    e.id as enrollment_id,
    e.participant_id,
    e.program_id,
    e.status,
    e.referral_code_id,
    e.notes as full_notes,
    e.created_at,
    -- Simple extraction - ambil semua text setelah "Referral Code:" atau "referral:"
    CASE 
        WHEN POSITION('Referral Code:' IN e.notes) > 0 THEN 
            TRIM(SUBSTRING(e.notes, POSITION('Referral Code:' IN e.notes) + 15))
        WHEN POSITION('referral code:' IN LOWER(e.notes)) > 0 THEN 
            TRIM(SUBSTRING(e.notes, POSITION('referral code:' IN LOWER(e.notes)) + 15))
        WHEN POSITION('referral:' IN LOWER(e.notes)) > 0 THEN 
            TRIM(SUBSTRING(e.notes, POSITION('referral:' IN LOWER(e.notes)) + 9))
        ELSE NULL
    END as extracted_referral_code
FROM enrollments e
WHERE e.id = 'f7689b12-5d0d-4902-b25a-7b7db882daef'  -- GANTI dengan enrollment_id
ORDER BY e.created_at DESC;

-- Step 2: Untuk enrollment tertentu, cari referral_code_id dari referral_codes
-- ============================================================================
-- GANTI dengan enrollment_id dan extracted referral code dari Step 1
-- 
-- Misalnya jika enrollment_id = 'f7689b12-5d0d-4902-b25a-7b7db882daef'
-- dan extracted referral code = 'ABC123'
--
-- SELECT 
--     rc.id as referral_code_id,
--     rc.code as referral_code_text,
--     rc.trainer_id
-- FROM referral_codes rc
-- WHERE UPPER(rc.code) = UPPER('ABC123')  -- GANTI dengan referral code dari Step 1
-- AND rc.is_active = true;

-- Step 3: Update enrollment dengan referral_code_id yang ditemukan
-- ============================================================================
-- UNCOMMENT dan sesuaikan setelah mendapatkan referral_code_id dari Step 2:
--
-- UPDATE enrollments
-- SET referral_code_id = 'REFERRAL_CODE_ID_DARI_STEP_2',
--     updated_at = NOW()
-- WHERE id = 'f7689b12-5d0d-4902-b25a-7b7db882daef';  -- GANTI dengan enrollment_id
--
-- Setelah update, jalankan script di Step 4 untuk membuat referral_tracking

-- Step 4: Buat referral_tracking record setelah enrollment di-update
-- ============================================================================
-- UNCOMMENT setelah enrollment di-update di Step 3:
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
--     END,
--     0,
--     0
-- FROM enrollments e
-- JOIN referral_codes rc ON rc.id = e.referral_code_id
-- WHERE e.id = 'f7689b12-5d0d-4902-b25a-7b7db882daef'  -- GANTI dengan enrollment_id
-- AND NOT EXISTS (
--     SELECT 1 FROM referral_tracking rt 
--     WHERE rt.enrollment_id = e.id
-- );

-- ============================================================================
-- ALTERNATIVE: Jika Anda tahu referral code-nya langsung
-- ============================================================================
-- Jika Anda tahu referral code text (bukan ID), gunakan script ini:
--
-- UPDATE enrollments e
-- SET 
--     referral_code_id = rc.id,
--     updated_at = NOW()
-- FROM referral_codes rc
-- WHERE e.id = 'f7689b12-5d0d-4902-b25a-7b7db882daef'  -- GANTI enrollment_id
-- AND UPPER(rc.code) = UPPER('REFERRAL_CODE_TEXT')  -- GANTI dengan referral code text
-- AND rc.is_active = true;
