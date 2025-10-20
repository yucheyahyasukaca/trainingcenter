-- Verify Trainers Table Setup
-- Run this to check if the trainers table is working correctly

-- Check if trainers table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'trainers';

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'trainers'
ORDER BY ordinal_position;

-- Check if there are any trainers
SELECT COUNT(*) as total_trainers FROM trainers;

-- Check sample data
SELECT 
    id,
    name,
    email,
    specialization,
    status,
    created_at
FROM trainers 
LIMIT 5;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'trainers';

-- Test insert (this should work if everything is set up correctly)
INSERT INTO trainers (name, email, phone, specialization, bio, experience_years, status) 
VALUES ('Test Trainer', 'test@example.com', '081234567999', 'Testing', 'Test bio', 5, 'active')
ON CONFLICT (email) DO NOTHING;

-- Check if the test insert worked
SELECT * FROM trainers WHERE email = 'test@example.com';

-- Clean up test data
DELETE FROM trainers WHERE email = 'test@example.com';

-- Final verification
SELECT 'Trainers table verification completed!' as message;
