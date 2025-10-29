-- ============================================================================
-- CHECK ENROLLMENT NOTES - SIMPLE VERSION
-- ============================================================================
-- Script sederhana untuk melihat notes enrollment
-- ============================================================================

-- GANTI enrollment_id: f7689b12-5d0d-4902-b25a-7b7db882daef
SELECT 
    e.id as enrollment_id,
    e.participant_id,
    e.program_id,
    e.status,
    e.referral_code_id,
    e.notes,
    LENGTH(e.notes) as notes_length,
    CASE 
        WHEN e.notes IS NULL THEN 'Notes is NULL'
        WHEN e.notes = '' THEN 'Notes is empty'
        WHEN e.notes ILIKE '%referral%' THEN 'Contains referral keyword'
        ELSE 'No referral keyword found'
    END as notes_status,
    e.created_at
FROM enrollments e
WHERE e.id = 'f7689b12-5d0d-4902-b25a-7b7db882daef';  -- GANTI enrollment_id

-- ============================================================================
-- Jika notes mengandung referral, lihat semua referral codes yang ada
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
