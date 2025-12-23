-- Migration to sync avatar_url from user_profiles to trainers
-- Addressing issue where profile picture is missing in trainers table

DO $$
DECLARE
    r RECORD;
    v_updated_count INTEGER := 0;
BEGIN
    FOR r IN 
        SELECT t.id, t.user_id, p.avatar_url
        FROM trainers t
        JOIN user_profiles p ON p.id = t.user_id
        WHERE p.avatar_url IS NOT NULL
        AND (t.avatar_url IS NULL OR t.avatar_url != p.avatar_url)
    LOOP
        UPDATE trainers
        SET avatar_url = r.avatar_url,
            updated_at = NOW()
        WHERE id = r.id;
        
        v_updated_count := v_updated_count + 1;
    END LOOP;

    RAISE NOTICE 'Synced avatar_url for % trainers', v_updated_count;
END $$;
