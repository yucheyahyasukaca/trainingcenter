-- Migration to refine trainer specialization based on program category
-- 1. Updates existing trainers who completed TOT to have the correct specialization (e.g. Artificial Intelligence)
-- 2. Updates the trigger function to dynamically assign specialization for future promotions

-- Part 1: Fix existing trainers
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT t.id as trainer_id, p.category, p.title
        FROM trainers t
        JOIN participants part ON part.user_id = t.user_id
        JOIN enrollments e ON e.participant_id = part.id
        JOIN programs p ON p.id = e.program_id
        WHERE e.status = 'completed'
        AND (p.title ILIKE '%TOT%' OR p.title ILIKE '%Training of Trainer%')
        AND t.specialization = 'General' -- Only update if currently default
    LOOP
        UPDATE trainers
        SET specialization = r.category,
            updated_at = NOW()
        WHERE id = r.trainer_id;
        
        RAISE NOTICE 'Updated trainer % specialization to % (from program %)', r.trainer_id, r.category, r.title;
    END LOOP;
END $$;

-- Part 2: Update the trigger function for future consistency
CREATE OR REPLACE FUNCTION process_tot_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_class_name TEXT;
    v_program_category TEXT;
    v_specialization TEXT;
BEGIN
    -- Check if status is completed
    IF NEW.status = 'completed' THEN
        -- Get Class Name
        SELECT name INTO v_class_name
        FROM classes
        WHERE id = NEW.class_id;

        -- Get Program Category
        -- We assume enrollment has program_id, or we fetch via class if needed. 
        -- Schema confirms enrollment has program_id.
        SELECT category INTO v_program_category
        FROM programs
        WHERE id = NEW.program_id;

        -- Default fallback if category is missing
        v_specialization := COALESCE(v_program_category, 'General');

        -- Check if it's a TOT class
        IF v_class_name ILIKE '%TOT%' OR v_class_name ILIKE '%Training of Trainer%' THEN
            -- Get User ID
            SELECT user_id INTO v_user_id
            FROM participants
            WHERE id = NEW.participant_id;

            -- 1. Promote User Role
            UPDATE user_profiles
            SET role = 'trainer'
            WHERE id = v_user_id;

            -- 2. Create Trainer Record (if not exists)
            -- We typically want to execute this if they are NOT already a trainer,
            -- OR if they are a trainer but we want to update their specialization?
            -- Let's stick to INSERT ON CONFLICT DO NOTHING for safety, 
            -- but maybe we should update specialization if it was 'General'?
            -- For now, let's just use the dynamic specialization for the INSERT.
            
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
            SELECT 
                id, 
                full_name, 
                email, 
                NOW(), 
                NOW(),
                v_specialization,
                0, -- Default
                '-' -- Default
            FROM user_profiles
            WHERE id = v_user_id
            ON CONFLICT (user_id) DO UPDATE
            SET specialization = EXCLUDED.specialization
            WHERE trainers.specialization = 'General'; -- Only upgrade from General
            
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
