-- Check participants table schema
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'participants';

-- Check constraints on participants table
SELECT 
    conname AS constraint_name, 
    contype AS constraint_type, 
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM 
    pg_constraint c 
JOIN 
    pg_namespace n ON n.oid = c.connamespace 
WHERE 
    n.nspname = 'public' 
    AND c.conrelid = 'public.participants'::regclass;
