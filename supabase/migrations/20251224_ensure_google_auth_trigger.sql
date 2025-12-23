-- Migration to ensure Google Auth users get a profile
-- Created: 2025-12-24

-- 1. Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role text := 'user';
    user_full_name text;
    user_avatar_url text;
BEGIN
    -- Extract full name from metadata or use email username as fallback
    user_full_name := COALESCE(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1)
    );

    -- Extract avatar url from metadata (Google uses 'picture', others might use 'avatar_url')
    user_avatar_url := COALESCE(
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'picture'
    );

    -- Insert into user_profiles
    INSERT INTO public.user_profiles (id, email, full_name, role, is_active, avatar_url)
    VALUES (
        new.id,
        new.email,
        user_full_name,
        default_role,
        true,
        user_avatar_url
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.user_profiles.avatar_url),
        updated_at = now();

    -- If role is 'user', ensure they have a participant record
    IF default_role = 'user' THEN
        INSERT INTO public.participants (user_id, name, email, phone, created_at, updated_at)
        VALUES (
            new.id,
            user_full_name,
            new.email,
            '', -- Empty phone by default
            now(),
            now()
        )
        ON CONFLICT (email) DO NOTHING;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-create Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill existing users who are missing profiles
DO $$
DECLARE
    user_record RECORD;
    user_full_name text;
    user_avatar_url text;
BEGIN
    FOR user_record IN 
        SELECT * FROM auth.users 
        WHERE id NOT IN (SELECT id FROM public.user_profiles)
    LOOP
        user_full_name := COALESCE(
            user_record.raw_user_meta_data->>'full_name',
            user_record.raw_user_meta_data->>'name',
            split_part(user_record.email, '@', 1)
        );

        user_avatar_url := COALESCE(
            user_record.raw_user_meta_data->>'avatar_url',
            user_record.raw_user_meta_data->>'picture'
        );

        INSERT INTO public.user_profiles (id, email, full_name, role, is_active, avatar_url)
        VALUES (
            user_record.id,
            user_record.email,
            user_full_name,
            'user',
            true,
            user_avatar_url
        )
        ON CONFLICT (id) DO NOTHING;

        -- Create participant record if not exists
        INSERT INTO public.participants (user_id, name, email, phone)
        VALUES (
            user_record.id,
            user_full_name,
            user_record.email,
            ''
        )
        ON CONFLICT (email) DO NOTHING;
        
        RAISE NOTICE 'Synced user: %', user_record.email;
    END LOOP;
END $$;
