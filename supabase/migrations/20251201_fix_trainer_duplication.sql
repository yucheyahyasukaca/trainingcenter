-- Fix Trainer Profile Duplication and Linkage
-- Problem: User is linked to 'General' profile, but wants to use 'Kecerdasan Artifisial' profile.
-- Solution: 
-- 1. Find the 'General' profile (currently linked).
-- 2. Find the 'Kecerdasan Artifisial' profile (currently unlinked or wrong link).
-- 3. Transfer user_id from General to KA profile.
-- 4. Transfer any existing submissions from General to KA profile.
-- 5. Delete the General profile.

DO $$
DECLARE
    v_general_id UUID;
    v_target_id UUID;
    v_user_id UUID;
BEGIN
    -- 1. Get the ID and User ID of the 'General' profile
    SELECT id, user_id INTO v_general_id, v_user_id
    FROM trainers
    WHERE name ILIKE '%Yuche Yahya Sukaca%' 
    AND specialization ILIKE '%General%'
    LIMIT 1;

    -- 2. Get the ID of the 'Kecerdasan Artifisial' profile
    SELECT id INTO v_target_id
    FROM trainers
    WHERE name ILIKE '%Yuche Yahya Sukaca%' 
    AND specialization ILIKE '%Kecerdasan Artifisial%'
    LIMIT 1;

    -- 3. Logic
    IF v_general_id IS NOT NULL AND v_target_id IS NOT NULL THEN
        
        RAISE NOTICE 'Found General ID: %, Target ID: %, User ID: %', v_general_id, v_target_id, v_user_id;

        -- Link the target profile to the user
        -- We only update if v_user_id is present
        IF v_user_id IS NOT NULL THEN
            -- CRITICAL FIX: First, remove the user_id from the old profile to avoid unique constraint violation
            UPDATE trainers 
            SET user_id = NULL 
            WHERE id = v_general_id;
            
            -- Now we can safely assign it to the new profile
            UPDATE trainers
            SET user_id = v_user_id
            WHERE id = v_target_id;
        END IF;
        
        -- Move submissions from General to Target
        UPDATE hebat_submissions 
        SET trainer_id = v_target_id 
        WHERE trainer_id = v_general_id;
        
        -- Delete points/activities for General
        DELETE FROM trainer_hebat_points WHERE trainer_id = v_general_id;
        DELETE FROM trainer_hebat_activities WHERE trainer_id = v_general_id;
        
        -- Delete the General profile
        DELETE FROM trainers WHERE id = v_general_id;
        
        -- Trigger point recalculation for the target profile (optional, but good practice)
        -- We can insert a dummy activity or just let the next submission handle it.
        -- Or we can manually insert the points if we moved submissions.
        -- Since we moved submissions, the trigger didn't fire for them on the new ID.
        -- Let's manually insert the activity for the moved submissions if they don't exist.
        
        INSERT INTO trainer_hebat_activities (trainer_id, category, activity_type, description, points, metadata)
        SELECT 
            v_target_id, 
            'E', 
            'submission', 
            'Laporan Kegiatan Eksplorasi (Transferred)', 
            20, 
            jsonb_build_object('submission_id', id, 'note', 'Transferred from General profile')
        FROM hebat_submissions
        WHERE trainer_id = v_target_id
        AND NOT EXISTS (
            SELECT 1 FROM trainer_hebat_activities 
            WHERE trainer_id = v_target_id 
            AND (metadata->>'submission_id')::uuid = hebat_submissions.id
        );

        RAISE NOTICE 'Successfully fixed profile linkage and cleaned up duplicate.';
    ELSE
        RAISE NOTICE 'Could not find both profiles. General: %, Target: %', v_general_id, v_target_id;
    END IF;
END $$;
