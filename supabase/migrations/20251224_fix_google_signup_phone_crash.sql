-- Fix for Google Signup Failure (Phone Constraint Issue)
-- 1. Ensure avatar_url column exists in user_profiles (idempotent check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.user_profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- 2. Make phone nullable in participants to allow users without phone numbers
ALTER TABLE public.participants ALTER COLUMN phone DROP NOT NULL;

-- Optional: Clean up existing empty strings to NULLs to avoid future confusion
UPDATE public.participants SET phone = NULL WHERE phone = '';

-- 3. Update function to handle new user signup (Using NULL for phone)
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

    -- Extract avatar url from metadata
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
            NULL, -- CRITICAL FIX: Use NULL to avoid unique constraint violation on empty string
            now(),
            now()
        )
        ON CONFLICT (email) DO NOTHING;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ensure Trigger is properly set
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
