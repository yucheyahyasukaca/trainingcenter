-- Update function to sync referral points (1 point per ANY referral)
CREATE OR REPLACE FUNCTION sync_referral_to_hebat_points()
RETURNS TRIGGER AS $$
DECLARE
    v_trainer_id UUID;
    v_program_title TEXT;
    v_points INTEGER := 1;
BEGIN
    -- Award point on INSERT (new referral registered)
    IF TG_OP = 'INSERT' THEN
        v_trainer_id := NEW.trainer_id;
        
        SELECT title INTO v_program_title FROM programs WHERE id = NEW.program_id;
        
        INSERT INTO trainer_hebat_activities (
            trainer_id,
            category,
            activity_type,
            description,
            points,
            metadata
        ) VALUES (
            v_trainer_id,
            'B', -- Berbagi
            'referral',
            'Referral registered for ' || COALESCE(v_program_title, 'Program'),
            v_points,
            jsonb_build_object('referral_id', NEW.id, 'program_id', NEW.program_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger to fire on INSERT only (since we count registration)
DROP TRIGGER IF EXISTS trigger_sync_referral_points ON referral_tracking;
CREATE TRIGGER trigger_sync_referral_points
    AFTER INSERT ON referral_tracking
    FOR EACH ROW
    EXECUTE FUNCTION sync_referral_to_hebat_points();

-- Backfill existing points for ALL referrals (registered)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- For each referral_tracking that doesn't have a corresponding activity
    FOR r IN 
        SELECT rt.*, p.title as program_title 
        FROM referral_tracking rt
        LEFT JOIN programs p ON p.id = rt.program_id
        WHERE NOT EXISTS (
            SELECT 1 FROM trainer_hebat_activities tha 
            WHERE tha.metadata->>'referral_id' = rt.id::text
        )
    LOOP
        INSERT INTO trainer_hebat_activities (
            trainer_id,
            category,
            activity_type,
            description,
            points,
            metadata
        ) VALUES (
            r.trainer_id,
            'B',
            'referral',
            'Referral registered for ' || COALESCE(r.program_title, 'Program'),
            1,
            jsonb_build_object('referral_id', r.id, 'program_id', r.program_id)
        );
    END LOOP;
END $$;
