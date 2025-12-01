-- List all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check trainers table schema details
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'trainers';
