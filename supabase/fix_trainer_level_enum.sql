-- ============================================================================
-- FIX: Replace invalid trainer_level assignment ("level_0") with valid enum
-- This script drops the broken trigger and recreates the CORRECT auto-promote
-- trigger that handles BOTH certificate_issued AND status completed/approved.
-- ============================================================================

-- 1) Drop BOTH legacy triggers (the broken one with level_0 and any duplicates)
DROP TRIGGER IF EXISTS trigger_promote_tot_graduates ON enrollments;
DROP TRIGGER IF EXISTS trigger_promote_tot_graduate ON enrollments;

-- 2) Drop legacy functions that may have invalid trainer_level assignment
DROP FUNCTION IF EXISTS promote_tot_graduates_to_trainers();

-- 3) Create the CORRECT function that handles certificate_issued AND status changes
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

    -- ✅ GRADUATION CONDITION: certificate issued OR status becomes completed/approved
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
            trainer_level = COALESCE(trainer_level, 'junior'), -- ✅ Valid enum value
            updated_at = NOW()
        WHERE id = v_user_id
          AND role = 'user';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4) Create the CORRECT trigger
CREATE TRIGGER trigger_promote_tot_graduate
    AFTER UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION promote_tot_graduate();

-- 5) Optional: Backfill existing users who have completed TOT
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
    AND up.role IN ('user', 'trainer')
    AND (e.status = 'completed' OR COALESCE(e.certificate_issued, FALSE) = TRUE);

  GET DIAGNOSTICS _count = ROW_COUNT;
  RAISE NOTICE '✓ Backfill promoted/normalized % user(s) to trainer with valid trainer_level', _count;
END $$;


