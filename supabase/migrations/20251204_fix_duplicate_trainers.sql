-- Function to clean up duplicate trainers
CREATE OR REPLACE FUNCTION cleanup_duplicate_trainers()
RETURNS void AS $$
DECLARE
    r RECORD;
    keep_id UUID;
BEGIN
    -- Loop through users with multiple trainer records
    FOR r IN 
        SELECT user_id 
        FROM trainers 
        GROUP BY user_id 
        HAVING COUNT(*) > 1
    LOOP
        -- Find the trainer ID to keep (e.g., the one with the most points or the oldest/newest)
        -- Here we'll keep the one with the most total_points in trainer_hebat_points
        -- If no points, keep the oldest one
        SELECT t.id INTO keep_id
        FROM trainers t
        LEFT JOIN trainer_hebat_points thp ON t.id = thp.trainer_id
        WHERE t.user_id = r.user_id
        ORDER BY COALESCE(thp.total_points, 0) DESC, t.created_at ASC
        LIMIT 1;

        -- Delete other trainer records for this user
        -- Note: This might cascade delete related records depending on FK constraints
        -- If we want to merge points, we'd need more complex logic. 
        -- Assuming we just want to remove the "ghost" duplicates that might have been created erroneously.
        
        -- First, delete related points records for the trainers we are about to delete
        DELETE FROM trainer_hebat_points
        WHERE trainer_id IN (
            SELECT id FROM trainers 
            WHERE user_id = r.user_id AND id != keep_id
        );

        -- Then delete the duplicate trainers
        DELETE FROM trainers
        WHERE user_id = r.user_id AND id != keep_id;
        
        RAISE NOTICE 'Cleaned up duplicates for user_id %, kept trainer_id %', r.user_id, keep_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the cleanup
SELECT cleanup_duplicate_trainers();

-- Add a unique constraint to prevent future duplicates
ALTER TABLE trainers
ADD CONSTRAINT unique_user_trainer UNIQUE (user_id);
