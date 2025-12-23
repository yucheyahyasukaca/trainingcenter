-- FINAL FIX: Handle ID Mismatch between User ID and Trainer UUID

-- 1. Update function to award 1 point per referral AND USE CORRECT TRAINER ID
CREATE OR REPLACE FUNCTION sync_referral_to_hebat_points()
RETURNS TRIGGER AS $$
DECLARE
    v_actual_trainer_id UUID; -- The UUID from trainers table
    v_program_title TEXT;
    v_points INTEGER := 1; -- 1 point per referral
    v_referral_type TEXT := 'GTK';
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- CRITICAL FIX: Look up the Trainer UUID from the User ID
        SELECT id INTO v_actual_trainer_id FROM trainers WHERE user_id = NEW.trainer_id;
        
        -- If found, verify/insert
        IF v_actual_trainer_id IS NOT NULL THEN
            SELECT title INTO v_program_title FROM programs WHERE id = NEW.program_id;
            
            INSERT INTO trainer_hebat_activities (
                trainer_id, -- Using the UUID
                category,
                activity_type,
                description,
                points,
                metadata
            ) VALUES (
                v_actual_trainer_id,
                'B', -- Berbagi
                'referral',
                'Referral registered for ' || COALESCE(v_program_title, 'Program'),
                v_points,
                jsonb_build_object(
                    'referral_id', NEW.id, 
                    'program_id', NEW.program_id,
                    'referral_type', v_referral_type,
                    'original_user_id', NEW.trainer_id
                )
            );
            
            -- Optional: Update totals immediately (or let a separate trigger do it)
            -- For safety, we can rely on existing point summary triggers or do it next.
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Recreate trigger
DROP TRIGGER IF EXISTS trigger_sync_referral_points ON referral_tracking;
CREATE TRIGGER trigger_sync_referral_points
    AFTER INSERT ON referral_tracking
    FOR EACH ROW
    EXECUTE FUNCTION sync_referral_to_hebat_points();

-- 3. Backfill Logic with Correct ID Lookup
DO $$
DECLARE
    r RECORD;
    v_actual_trainer_id UUID;
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting backfill...';
    
    FOR r IN 
        SELECT rt.*, p.title as program_title 
        FROM referral_tracking rt
        LEFT JOIN programs p ON p.id = rt.program_id
    LOOP
        -- Look up Trainer UUID for each referral
        SELECT id INTO v_actual_trainer_id FROM trainers WHERE user_id = r.trainer_id;
        
        IF v_actual_trainer_id IS NOT NULL THEN
            -- Check if we already have an activity for this referral
            IF NOT EXISTS (
                SELECT 1 FROM trainer_hebat_activities tha 
                WHERE tha.metadata->>'referral_id' = r.id::text
            ) THEN
                -- Insert missing activity
                INSERT INTO trainer_hebat_activities (
                    trainer_id,
                    category,
                    activity_type,
                    description,
                    points,
                    metadata
                ) VALUES (
                    v_actual_trainer_id,
                    'B',
                    'referral',
                    'Referral registered for ' || COALESCE(r.program_title, 'Program'),
                    1,
                    jsonb_build_object(
                        'referral_id', r.id, 
                        'program_id', r.program_id,
                        'referral_type', 'GTK',
                        'backfilled', true
                    )
                );
                v_count := v_count + 1;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Backfilled % activities. Recalculating totals...', v_count;

    -- 4. Recalculate totals for ALL trainers (to be safe)
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
