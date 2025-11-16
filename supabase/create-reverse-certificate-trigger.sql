-- ============================================================================
-- CREATE REVERSE TRIGGER: Update enrollment status when certificate is created
-- Ini adalah kebalikan dari trigger yang ada (yang generate certificate saat completed)
-- ============================================================================

-- 1. Function: Update enrollment status dan certificate_issued saat certificate dibuat
CREATE OR REPLACE FUNCTION update_enrollment_on_certificate_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Update enrollment status ke 'completed' jika certificate untuk participant
    IF NEW.recipient_type = 'participant' THEN
        UPDATE enrollments
        SET 
            status = 'completed',
            certificate_issued = TRUE,
            updated_at = NOW()
        WHERE program_id = NEW.program_id
          AND participant_id = NEW.recipient_id
          AND status != 'completed'; -- Only update if not already completed
          
        RAISE NOTICE 'Updated enrollment to completed for participant % on program %', 
            NEW.recipient_id, NEW.program_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop trigger jika sudah ada
DROP TRIGGER IF EXISTS trigger_update_enrollment_on_certificate ON certificates;

-- 3. Create trigger
CREATE TRIGGER trigger_update_enrollment_on_certificate
    AFTER INSERT ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_enrollment_on_certificate_created();

-- 4. Test: Verify trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_enrollment_on_certificate';

-- 5. Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Trigger created: enrollment will auto-update to completed when certificate is issued';
END $$;

