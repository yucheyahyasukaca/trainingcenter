-- ============================================================================
-- AUTO PROMOTE USERS TO TRAINER AFTER TOT GRADUATION
-- Runs on enrollments updates and a one-time backfill. Idempotent and safe.
-- ============================================================================

-- 1) Trigger function: promote when a TOT enrollment is finished
CREATE OR REPLACE FUNCTION promote_tot_graduate()
RETURNS TRIGGER AS $$
DECLARE
    v_program_type VARCHAR(20);
    v_user_id UUID;
BEGIN
    -- Only act on status/certificate changes
    IF TG_OP = 'UPDATE' THEN
        -- Quick exit if nothing relevant changed
        IF COALESCE(NEW.status, '') = COALESCE(OLD.status, '')
           AND COALESCE(NEW.certificate_issued, FALSE) = COALESCE(OLD.certificate_issued, FALSE) THEN
           RETURN NEW;
        END IF;
    END IF;

    -- Check program type is TOT
    SELECT program_type INTO v_program_type FROM programs WHERE id = NEW.program_id;
    IF v_program_type IS DISTINCT FROM 'tot' THEN
        RETURN NEW;
    END IF;

    -- Graduation condition: certificate issued OR status becomes completed/approved
    IF NOT (COALESCE(NEW.certificate_issued, FALSE)
            OR NEW.status IN ('completed','approved')) THEN
        RETURN NEW;
    END IF;

    -- Find user id from participant
    SELECT user_id INTO v_user_id FROM participants WHERE id = NEW.participant_id;

    IF v_user_id IS NOT NULL THEN
        -- Promote if still a regular user; do not change admins/managers
        UPDATE user_profiles
        SET role = 'trainer',
            trainer_level = COALESCE(trainer_level, 'junior'),
            updated_at = NOW()
        WHERE id = v_user_id
          AND role = 'user';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Trigger: fire after updates to enrollments
DROP TRIGGER IF EXISTS trigger_promote_tot_graduate ON enrollments;
CREATE TRIGGER trigger_promote_tot_graduate
    AFTER UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION promote_tot_graduate();

-- 3) One-time backfill: promote existing graduates (safe to re-run)
DO $$
DECLARE
    _count INTEGER := 0;
BEGIN
    UPDATE user_profiles up
    SET role = 'trainer',
        trainer_level = COALESCE(up.trainer_level, 'junior'),
        updated_at = NOW()
    FROM enrollments e
    JOIN programs p ON p.id = e.program_id AND p.program_type = 'tot'
    JOIN participants pa ON pa.id = e.participant_id
    WHERE pa.user_id = up.id
      AND up.role = 'user'
      AND (COALESCE(e.certificate_issued, FALSE) = TRUE OR e.status IN ('completed','approved'));

    GET DIAGNOSTICS _count = ROW_COUNT;
    RAISE NOTICE '✓ Auto-promote backfill updated % users to trainer', _count;
END $$;


