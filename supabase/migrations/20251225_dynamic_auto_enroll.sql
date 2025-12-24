-- Dynamic Auto-Enrollment Migration

-- 1. Add Auto-Enroll Flag to Classes
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS auto_enroll BOOLEAN DEFAULT FALSE;

-- 2. Set the default class (TOT Gemini untuk Pendidik) to auto-enroll
UPDATE public.classes
SET auto_enroll = TRUE
WHERE id = 'd97d8dd6-ced6-4c67-b076-216f2acf6094';

-- 3. Update the Trigger Function to use the dynamic flag
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role text := 'user';
    user_full_name text;
    new_participant_id uuid;
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

    -- If role is 'user', ensure they have a participant record and auto-enroll
    IF default_role = 'user' THEN
        -- Insert Participant
        INSERT INTO public.participants (user_id, name, email, phone, created_at, updated_at)
        VALUES (
            new.id,
            user_full_name,
            new.email,
            '', -- Empty phone by default
            now(),
            now()
        )
        ON CONFLICT (email) DO UPDATE SET updated_at = now()
        RETURNING id INTO new_participant_id;

        -- If returning failed (e.g. conflict existed), fetch the ID
        IF new_participant_id IS NULL THEN
            SELECT id INTO new_participant_id FROM public.participants WHERE user_id = new.id;
        END IF;

        -- DYNAMIC AUTO-ENROLLMENT
        -- Enroll user into ALL classes marked as auto_enroll = true
        INSERT INTO public.enrollments (class_id, program_id, participant_id, user_id, status, created_at, updated_at)
        SELECT 
            c.id as class_id,
            c.program_id,
            new_participant_id,
            new.id,
            'approved',
            now(),
            now()
        FROM public.classes c
        WHERE c.auto_enroll = TRUE
        ON CONFLICT (participant_id, program_id) DO NOTHING;
        
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
