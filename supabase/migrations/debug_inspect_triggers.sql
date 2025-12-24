-- Inspect Triggers and Constraints for Debugging
-- Lists all triggers on user_profiles and participants
SELECT 
    event_object_table as table_name, 
    trigger_name, 
    event_manipulation as event,
    action_timing as timing,
    action_statement as definition
FROM information_schema.triggers 
WHERE event_object_table IN ('user_profiles', 'participants', 'users');

-- List all constraints
SELECT 
    conrelid::regclass AS table_name, 
    conname AS constraint_name, 
    pg_get_constraintdef(c.oid) 
FROM pg_constraint c 
JOIN pg_namespace n ON n.oid = c.connamespace 
WHERE n.nspname = 'public' 
AND conrelid::regclass::text IN ('user_profiles', 'participants');

-- Check if any other table depends on user_profiles via foreign key
SELECT 
    conname AS constraint_name, 
    conrelid::regclass AS table_name, 
    pg_get_constraintdef(c.oid) 
FROM pg_constraint c 
WHERE confrelid = 'public.user_profiles'::regclass;
