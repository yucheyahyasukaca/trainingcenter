-- Check if the user exists in profiles
SELECT * FROM profiles WHERE id = '42b63c7d-40fa-4b23-9be2-55b4dad1d97c';

-- Check if we can insert them into trainers
-- We need to know what columns are required for trainers
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'trainers';
