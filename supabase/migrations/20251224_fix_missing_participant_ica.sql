-- Fix missing participant for ica@garuda-21.com
-- Detected by debug_verify_users_sync.sql

INSERT INTO public.participants (user_id, name, email, phone, created_at, updated_at)
SELECT 
    id,
    full_name,
    email,
    '',
    now(),
    now()
FROM public.user_profiles
WHERE email = 'ica@garuda-21.com'
AND NOT EXISTS (
    SELECT 1 FROM public.participants WHERE email = 'ica@garuda-21.com'
);
