-- Update function to sync referral points (2 points for GTK, 1 for Student)
CREATE OR REPLACE FUNCTION sync_referral_to_hebat_points()
RETURNS TRIGGER AS $$
DECLARE
    v_trainer_id UUID;
    v_program_title TEXT;
    v_points INTEGER := 2; -- Default to 2 points (GTK) as per instruction
    v_referral_type TEXT := 'GTK'; -- Default type
BEGIN
    -- Award point on INSERT (new referral registered)
    IF TG_OP = 'INSERT' THEN
        v_trainer_id := NEW.trainer_id;
        
        SELECT title INTO v_program_title FROM programs WHERE id = NEW.program_id;
        
        -- Future logic: Check if program is for students to set v_points = 1
        -- For now, all are assumed GTK = 2 points
        
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
            jsonb_build_object(
                'referral_id', NEW.id, 
                'program_id', NEW.program_id,
                'referral_type', v_referral_type
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger to fire on INSERT only
DROP TRIGGER IF EXISTS trigger_sync_referral_points ON referral_tracking;
CREATE TRIGGER trigger_sync_referral_points
    AFTER INSERT ON referral_tracking
    FOR EACH ROW
    EXECUTE FUNCTION sync_referral_to_hebat_points();

-- Backfill existing points for ALL referrals (registered)
-- Update existing 1 point records to 2 points
DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Update existing activities to 2 points if they are referrals
    UPDATE trainer_hebat_activities
    SET points = 2,
        metadata = jsonb_set(metadata, '{referral_type}', '"GTK"')
    WHERE category = 'B' 
    AND activity_type = 'referral'
    AND points = 1;

    -- 2. Insert missing activities (if any)
    FOR r IN 
        SELECT rt.*, p.title as program_title 
        FROM referral_tracking rt
        JOIN trainers t ON t.id = rt.trainer_id -- Ensure trainer exists
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
            2, -- Default 2 points
            jsonb_build_object(
                'referral_id', r.id, 
                'program_id', r.program_id,
                'referral_type', 'GTK'
            )
        );
    END LOOP;
    
    -- 3. Recalculate total points in trainer_hebat_points
    -- This is handled by the trigger on trainer_hebat_activities, but we might need to force a refresh if we did bulk updates
    -- The trigger `trigger_update_hebat_points` fires AFTER INSERT, but we did UPDATE above.
    -- We need to manually update the totals for trainers who had updates.
    
    UPDATE trainer_hebat_points thp
    SET 
        b_points = (
            SELECT COALESCE(SUM(points), 0)
            FROM trainer_hebat_activities tha
            WHERE tha.trainer_id = thp.trainer_id AND tha.category = 'B'
        ),
        total_points = (
            SELECT COALESCE(SUM(points), 0)
            FROM trainer_hebat_activities tha
            WHERE tha.trainer_id = thp.trainer_id
        );
        
END $$;
