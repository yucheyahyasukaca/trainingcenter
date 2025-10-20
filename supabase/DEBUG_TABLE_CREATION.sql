-- Debug Table Creation Issues
-- Run this to diagnose why the table might not be visible

-- Check current schema
SELECT current_schema();

-- Check if we're in the right database
SELECT current_database();

-- List all tables in public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if trainers table exists in any schema
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'trainers'
ORDER BY table_schema;

-- Check permissions on public schema
SELECT 
    schema_name,
    schema_owner
FROM information_schema.schemata 
WHERE schema_name = 'public';

-- Check if we have CREATE privileges
SELECT 
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name = 'trainers';

-- Check current user
SELECT current_user;

-- Check if we can create tables
SELECT has_schema_privilege('public', 'CREATE') as can_create_in_public;

-- Try to create a simple test table
CREATE TABLE IF NOT EXISTS test_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50)
);

-- Check if test table was created
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'test_table';

-- Clean up test table
DROP TABLE IF EXISTS test_table;

-- Final check for trainers table
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'trainers'
        ) 
        THEN 'Trainers table EXISTS' 
        ELSE 'Trainers table DOES NOT EXIST' 
    END as table_status;
