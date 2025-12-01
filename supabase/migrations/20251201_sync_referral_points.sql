-- Function to sync referral points to HEBAT points
CREATE OR REPLACE FUNCTION sync_referral_to_hebat_points()
RETURNS TRIGGER AS $$
DECLARE
    v_trainer_id UUID;
    v_program_title TEXT;
    v_points INTEGER := 1; -- 1 point per confirmed referral
BEGIN
    -- Only proceed if status is confirmed
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        
        v_trainer_id := NEW.trainer_id;
        
        -- Get program title for description
        SELECT title INTO v_program_title FROM programs WHERE id = NEW.program_id;
        
        -- Insert into trainer_hebat_activities
        -- This will automatically trigger update_hebat_total_points via existing trigger
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
            'Referral confirmed for ' || COALESCE(v_program_title, 'Program'),
            v_points,
            jsonb_build_object('referral_id', NEW.id, 'program_id', NEW.program_id)
        );
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on referral_tracking
DROP TRIGGER IF EXISTS trigger_sync_referral_points ON referral_tracking;
CREATE TRIGGER trigger_sync_referral_points
    AFTER INSERT OR UPDATE ON referral_tracking
    FOR EACH ROW
    EXECUTE FUNCTION sync_referral_to_hebat_points();
