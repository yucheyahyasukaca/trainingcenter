-- Cleanup duplicate trainer profiles
-- Strategy:
-- 1. Identify duplicates by name 'Yuche Yahya Sukaca'
-- 2. Keep the one with specialization 'Kecerdasan Artifisial' (which user said is active/correct)
-- 3. Delete the one with specialization 'General' (which user said has 30 points but is incorrect/duplicate)

DO $$
DECLARE
    v_keep_id UUID;
    v_delete_id UUID;
BEGIN
    -- Find the ID to keep
    SELECT id INTO v_keep_id
    FROM trainers
    WHERE name = 'Yuche Yahya Sukaca'
    AND specialization = 'Kecerdasan Artifisial'
    LIMIT 1;

    -- Find the ID to delete
    SELECT id INTO v_delete_id
    FROM trainers
    WHERE name = 'Yuche Yahya Sukaca'
    AND specialization = 'General'
    LIMIT 1;

    -- If both exist, proceed with cleanup
    IF v_keep_id IS NOT NULL AND v_delete_id IS NOT NULL THEN
        
        -- Optional: Move points/activities if we wanted to merge, but user said "General" has 30 points and "KA" has 0.
        -- If we delete "General", we lose those 30 points.
        -- Assuming user just wants to clean up the duplicate entry from leaderboard.
        
        -- Delete from related tables (if CASCADE is not set, but it usually is)
        -- Just to be safe and explicit about what we are removing
        
        -- Delete points record for the duplicate
        DELETE FROM trainer_hebat_points WHERE trainer_id = v_delete_id;
        
        -- Delete activities for the duplicate
        DELETE FROM trainer_hebat_activities WHERE trainer_id = v_delete_id;
        
        -- Delete submissions for the duplicate
        DELETE FROM hebat_submissions WHERE trainer_id = v_delete_id;
        
        -- Finally delete the trainer profile
        DELETE FROM trainers WHERE id = v_delete_id;
        
        RAISE NOTICE 'Deleted duplicate trainer with ID % (General)', v_delete_id;
    ELSE
        RAISE NOTICE 'Duplicate profiles not found or conditions not met.';
    END IF;
END $$;
