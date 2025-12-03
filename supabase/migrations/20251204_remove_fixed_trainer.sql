-- Remove the 'Fixed Trainer (Main)' test record
DO $$
DECLARE
    fixed_trainer_id UUID;
BEGIN
    -- Find the trainer ID
    SELECT id INTO fixed_trainer_id
    FROM trainers
    WHERE name = 'Fixed Trainer (Main)';

    IF fixed_trainer_id IS NOT NULL THEN
        -- Delete related points
        DELETE FROM trainer_hebat_points WHERE trainer_id = fixed_trainer_id;
        
        -- Delete related activities
        DELETE FROM trainer_hebat_activities WHERE trainer_id = fixed_trainer_id;
        
        -- Delete related submissions (if any)
        DELETE FROM hebat_submissions WHERE trainer_id = fixed_trainer_id;

        -- Delete the trainer record
        DELETE FROM trainers WHERE id = fixed_trainer_id;
        
        RAISE NOTICE 'Deleted Fixed Trainer (Main) with ID: %', fixed_trainer_id;
    ELSE
        RAISE NOTICE 'Fixed Trainer (Main) not found.';
    END IF;
END;
$$;
