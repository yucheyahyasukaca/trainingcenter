-- Function to consolidate duplicate trainers for a specific user name or NULL user_ids
CREATE OR REPLACE FUNCTION consolidate_duplicate_trainers()
RETURNS void AS $$
DECLARE
    main_trainer_id UUID;
    dup_record RECORD;
    total_h_points INT := 0;
    total_e_points INT := 0;
    total_b_points INT := 0;
    total_a_points INT := 0;
    total_t_points INT := 0;
    grand_total_points INT := 0;
BEGIN
    -- 1. Identify the "Main" Trainer Record for 'Yuche Yahya Sukaca'
    -- We prefer a record that has a NOT NULL user_id.
    -- If multiple exist, pick the one with the most points or oldest.
    SELECT t.id INTO main_trainer_id
    FROM trainers t
    LEFT JOIN trainer_hebat_points thp ON t.id = thp.trainer_id
    WHERE t.name ILIKE '%Yuche Yahya Sukaca%'
    ORDER BY (t.user_id IS NOT NULL) DESC, thp.total_points DESC, t.created_at ASC
    LIMIT 1;

    IF main_trainer_id IS NULL THEN
        RAISE NOTICE 'No trainer found for Yuche Yahya Sukaca';
        RETURN;
    END IF;

    RAISE NOTICE 'Main Trainer ID identified: %', main_trainer_id;

    -- 2. Loop through duplicates (same name, but different ID)
    FOR dup_record IN 
        SELECT t.id, thp.h_points, thp.e_points, thp.b_points, thp.a_points, thp.t_points, thp.total_points
        FROM trainers t
        LEFT JOIN trainer_hebat_points thp ON t.id = thp.trainer_id
        WHERE t.name ILIKE '%Yuche Yahya Sukaca%' AND t.id != main_trainer_id
    LOOP
        RAISE NOTICE 'Processing duplicate trainer: %', dup_record.id;

        -- Accumulate points from duplicate
        total_h_points := total_h_points + COALESCE(dup_record.h_points, 0);
        total_e_points := total_e_points + COALESCE(dup_record.e_points, 0);
        total_b_points := total_b_points + COALESCE(dup_record.b_points, 0);
        total_a_points := total_a_points + COALESCE(dup_record.a_points, 0);
        total_t_points := total_t_points + COALESCE(dup_record.t_points, 0);
        grand_total_points := grand_total_points + COALESCE(dup_record.total_points, 0);

        -- Reassign submissions/activities to the main trainer
        UPDATE hebat_submissions SET trainer_id = main_trainer_id WHERE trainer_id = dup_record.id;
        UPDATE trainer_hebat_activities SET trainer_id = main_trainer_id WHERE trainer_id = dup_record.id;
        
        -- Delete points record for duplicate
        DELETE FROM trainer_hebat_points WHERE trainer_id = dup_record.id;
        
        -- Delete duplicate trainer
        DELETE FROM trainers WHERE id = dup_record.id;
        
    END LOOP;

    -- 3. Update the main trainer's points with the accumulated values
    -- We add to the existing points of the main trainer
    UPDATE trainer_hebat_points
    SET 
        h_points = h_points + total_h_points,
        e_points = e_points + total_e_points,
        b_points = b_points + total_b_points,
        a_points = a_points + total_a_points,
        t_points = t_points + total_t_points,
        total_points = total_points + grand_total_points,
        updated_at = NOW()
    WHERE trainer_id = main_trainer_id;

    RAISE NOTICE 'Consolidation complete. Added % points to main trainer.', grand_total_points;
    
    -- 4. General Cleanup for any other NULL user_id trainers that are NOT the main one we just saved
    -- (Only if they don't have a name we want to keep, or we can just delete them if they are orphans)
    -- For safety, we won't bulk delete other NULLs yet, as we focused on Yuche.
    
END;
$$ LANGUAGE plpgsql;

-- Execute the consolidation
SELECT consolidate_duplicate_trainers();
