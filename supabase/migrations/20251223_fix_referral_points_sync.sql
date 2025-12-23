-- 1. Update function to award 1 point per referral (GTK)
CREATE OR REPLACE FUNCTION sync_referral_to_hebat_points()
RETURNS TRIGGER AS $$
DECLARE
    v_trainer_id UUID;
    v_program_title TEXT;
    v_points INTEGER := 1; -- 1 point per referral
    v_referral_type TEXT := 'GTK';
BEGIN
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

-- 2. Recreate trigger to ensure it's active
DROP TRIGGER IF EXISTS trigger_sync_referral_points ON referral_tracking;
CREATE TRIGGER trigger_sync_referral_points
    AFTER INSERT ON referral_tracking
    FOR EACH ROW
    EXECUTE FUNCTION sync_referral_to_hebat_points();

-- 3. Backfill missing points
DO $$
DECLARE
    r RECORD;
    v_count INTEGER := 0;
BEGIN
    -- Insert missing activities for existing referrals
    FOR r IN 
        SELECT rt.*, p.title as program_title 
        FROM referral_tracking rt
        -- FIX: Join using user_id, as referral_tracking.trainer_id stores the User Auth ID
        JOIN trainers t ON t.user_id = rt.trainer_id 
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
            1, -- 1 point for backfill
            jsonb_build_object(
                'referral_id', r.id, 
                'program_id', r.program_id,
                'referral_type', 'GTK'
            )
        );
        v_count := v_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Backfilled % activities', v_count;

    -- Recalculate totals
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
