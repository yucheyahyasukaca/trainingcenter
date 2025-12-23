-- Migration to auto-promote users who complete TOT module to 'trainer' role

-- Function to handle TOT completion
CREATE OR REPLACE FUNCTION process_tot_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_class_name TEXT;
    v_user_id UUID;
    v_user_email TEXT;
    v_user_name TEXT;
BEGIN
    -- Only process if status is 'completed'
    IF NEW.status = 'completed' THEN
        
         -- Check if the class is a TOT class
        SELECT name INTO v_class_name
        FROM classes
        WHERE id = NEW.class_id;

        -- Check for TOT match (case-insensitive)
        -- Matches "TOT" or "Training of Trainer"
        IF v_class_name ILIKE '%TOT%' OR v_class_name ILIKE '%Training of Trainer%' THEN
            
            -- Get User ID and details from participants -> user_profiles logic
            SELECT p.user_id, up.email, up.full_name 
            INTO v_user_id, v_user_email, v_user_name
            FROM participants p
            JOIN user_profiles up ON up.id = p.user_id
            WHERE p.id = NEW.participant_id;

            IF v_user_id IS NOT NULL THEN
                -- 1. Update user role to 'trainer' if not already
                UPDATE user_profiles
                SET role = 'trainer'
                WHERE id = v_user_id; -- Always ensure role is trainer

                -- 2. Ensure trainer record exists
                -- Note: trainers table has unique constraint on user_id
                INSERT INTO trainers (
                    user_id,
                    name,
                    email,
                    created_at,
                    updated_at,
                    specialization,
                    experience_years,
                    phone
                )
                VALUES (
                    v_user_id,
                    v_user_name,
                    v_user_email,
                    NOW(),
                    NOW(),
                    'General',
                    1,
                    '-'
                )
                ON CONFLICT (user_id) DO NOTHING;
                
                RAISE NOTICE 'Promoted user % to trainer after TOT completion', v_user_id;
            END IF;
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
DROP TRIGGER IF EXISTS trigger_auto_promote_tot ON enrollments;
CREATE TRIGGER trigger_auto_promote_tot
    AFTER UPDATE OF status ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION process_tot_completion();

-- Backfill: Process existing completed TOT enrollments
DO $$
DECLARE
    r RECORD;
    v_user_id UUID;
    v_user_email TEXT;
    v_user_name TEXT;
BEGIN
    FOR r IN 
        SELECT e.id, e.status, e.class_id, e.participant_id
        FROM enrollments e
        JOIN classes c ON c.id = e.class_id
        WHERE e.status = 'completed'
        AND (c.name ILIKE '%TOT%' OR c.name ILIKE '%Training of Trainer%')
    LOOP
        
        SELECT p.user_id, up.email, up.full_name 
        INTO v_user_id, v_user_email, v_user_name
        FROM participants p
        JOIN user_profiles up ON up.id = p.user_id
        WHERE p.id = r.participant_id;

        IF v_user_id IS NOT NULL THEN
            UPDATE user_profiles
            SET role = 'trainer'
            WHERE id = v_user_id;

            INSERT INTO trainers (
                user_id,
                name,
                email,
                created_at,
                updated_at,
                specialization,
                experience_years,
                phone
            )
            VALUES (
                v_user_id,
                v_user_name,
                v_user_email,
                NOW(),
                NOW(),
                'General',
                1,
                '-'
            )
            ON CONFLICT (user_id) DO NOTHING;
            
            RAISE NOTICE 'Backfilled trainer promotion for user %', v_user_id;
        END IF;
    END LOOP;
END $$;
