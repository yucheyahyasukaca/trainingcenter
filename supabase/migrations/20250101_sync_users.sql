-- Migration to sync auth.users to public.user_profiles and public.participants

-- 1. Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role text := 'user';
    user_full_name text;
BEGIN
    -- Extract full name from metadata or use email username as fallback
    user_full_name := COALESCE(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1)
    );

    -- Insert into user_profiles
    INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
    VALUES (
        new.id,
        new.email,
        user_full_name,
        default_role,
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = now();

    -- If role is 'user', ensure they have a participant record
    IF default_role = 'user' THEN
        INSERT INTO public.participants (user_id, name, email, phone, created_at, updated_at)
        VALUES (
            new.id,
            user_full_name,
            new.email,
            '', -- Empty phone by default, to be filled by user later
            now(),
            now()
        )
        ON CONFLICT (email) DO NOTHING; -- Handle potential email conflicts gracefully
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Trigger
-- Drop if exists to ensure clean state
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill existing users who are missing profiles
DO $$
DECLARE
    user_record RECORD;
    user_full_name text;
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

        INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
        VALUES (
            user_record.id,
            user_record.email,
            user_full_name,
            'user',
            true
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
