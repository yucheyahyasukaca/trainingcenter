-- ============================================================================
-- ENSURE REFERRAL CODE SYNC TRIGGER
-- ============================================================================
-- Trigger untuk memastikan referral_code_id di enrollment selalu sinkron
-- dengan referral_tracking saat referral_tracking dibuat
-- ============================================================================

-- Function untuk sync referral_code_id ke enrollment ketika referral_tracking dibuat
CREATE OR REPLACE FUNCTION sync_referral_code_to_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    -- Update enrollment dengan referral_code_id dari referral_tracking
    UPDATE enrollments
    SET 
        referral_code_id = NEW.referral_code_id,
        updated_at = NOW()
    WHERE id = NEW.enrollment_id
    AND (referral_code_id IS NULL OR referral_code_id != NEW.referral_code_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger jika sudah ada
DROP TRIGGER IF EXISTS trigger_sync_referral_code_to_enrollment ON referral_tracking;

-- Create trigger yang akan sync referral_code_id ke enrollment
CREATE TRIGGER trigger_sync_referral_code_to_enrollment
    AFTER INSERT OR UPDATE ON referral_tracking
    FOR EACH ROW
    WHEN (NEW.enrollment_id IS NOT NULL AND NEW.referral_code_id IS NOT NULL)
    EXECUTE FUNCTION sync_referral_code_to_enrollment();

-- ============================================================================
-- VERIFIKASI
-- ============================================================================
-- Test trigger dengan query ini (jangan jalankan kecuali untuk testing):
-- 
-- 1. Buat enrollment tanpa referral_code_id
-- 2. Buat referral_tracking dengan enrollment_id dan referral_code_id
-- 3. Cek apakah enrollment.referral_code_id terupdate otomatis
-- ============================================================================
