-- Robust Fix for Google Signup Failure
-- 1. Create a debug/error logging table to capture silent failures
CREATE TABLE IF NOT EXISTS public.signup_errors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    email TEXT,
    error_message TEXT,
    error_detail TEXT,
    step TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Make phone nullable in participants (Just in case it wasn't applied)
ALTER TABLE public.participants ALTER COLUMN phone DROP NOT NULL;

-- 3. Update function to handle new user signup with ERROR TRAPPING
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role text := 'user';
    user_full_name text;
    user_avatar_url text;
BEGIN
    BEGIN
        -- Extract full name
        user_full_name := COALESCE(
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'name',
            split_part(new.email, '@', 1)
        );

        -- Extract avatar url
        user_avatar_url := COALESCE(
            new.raw_user_meta_data->>'avatar_url',
            new.raw_user_meta_data->>'picture'
        );

        -- STEP 1: Insert into user_profiles
        BEGIN
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
        EXCEPTION WHEN OTHERS THEN
            -- Log error and CONTINUE. Do not fail the transaction.
            INSERT INTO public.signup_errors (user_id, email, error_message, step)
            VALUES (new.id, new.email, SQLERRM, 'user_profiles_insert');
            -- If profile fails, we probably can't do participant, but we let the auth user succeed.
            RAISE NOTICE 'Error inserting user_profile: %', SQLERRM;
        END;

        -- STEP 2: Insert into participants
        IF default_role = 'user' THEN
            BEGIN
                INSERT INTO public.participants (user_id, name, email, phone, created_at, updated_at)
                VALUES (
                    new.id,
                    user_full_name,
                    new.email,
                    NULL, -- Explicitly NULL to be safe
                    now(),
                    now()
                )
                ON CONFLICT (email) DO NOTHING;
            EXCEPTION WHEN OTHERS THEN
                -- Log error and CONTINUE
                INSERT INTO public.signup_errors (user_id, email, error_message, step)
                VALUES (new.id, new.email, SQLERRM, 'participants_insert');
                RAISE NOTICE 'Error inserting participant: %', SQLERRM;
            END;
        END IF;

    EXCEPTION WHEN OTHERS THEN
         -- Global catch
         INSERT INTO public.signup_errors (user_id, email, error_message, step)
         VALUES (new.id, new.email, SQLERRM, 'global_handler');
    END;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ensure Trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
