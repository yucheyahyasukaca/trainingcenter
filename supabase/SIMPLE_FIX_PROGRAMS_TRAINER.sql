-- Simple Fix for Programs Trainer Foreign Key
-- This is a simpler approach to fix the constraint issue

-- Step 1: Check current state
SELECT 'Current state check...' as step;

-- Check if programs table exists and has data
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'programs' AND table_schema = 'public')
        THEN 'Programs table exists'
        ELSE 'Programs table does not exist'
    END as programs_status;

-- Check if trainers table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trainers' AND table_schema = 'public')
        THEN 'Trainers table exists'
        ELSE 'Trainers table does not exist'
    END as trainers_status;

-- Step 2: Create trainers table if it doesn't exist
CREATE TABLE IF NOT EXISTS trainers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  bio TEXT,
  experience_years INTEGER NOT NULL DEFAULT 0,
  certification TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  avatar_url TEXT,
  hourly_rate DECIMAL(10, 2),
  availability_schedule JSONB,
  skills TEXT[],
  languages TEXT[]
);

-- Step 3: Insert a default trainer
INSERT INTO trainers (name, email, phone, specialization, bio, experience_years, status) 
VALUES (
    'Default Trainer', 
    'default.trainer@trainingcenter.com', 
    '081234567000', 
    'General Training', 
    'Default trainer for programs without specific trainer assignment', 
    5, 
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Step 4: Temporarily remove foreign key constraint if it exists
ALTER TABLE programs DROP CONSTRAINT IF EXISTS programs_trainer_id_fkey;

-- Step 5: Update programs to use the default trainer or set to NULL
-- First, let's see what trainer_id values exist in programs
SELECT DISTINCT trainer_id FROM programs WHERE trainer_id IS NOT NULL;

-- Update programs with invalid trainer_id to use default trainer
UPDATE programs 
SET trainer_id = (SELECT id FROM trainers WHERE email = 'default.trainer@trainingcenter.com' LIMIT 1)
WHERE trainer_id IS NOT NULL 
AND trainer_id NOT IN (SELECT id FROM trainers);

-- Step 6: Recreate foreign key constraint
ALTER TABLE programs 
ADD CONSTRAINT programs_trainer_id_fkey 
FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL;

-- Step 7: Enable RLS and create policies
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON trainers;
DROP POLICY IF EXISTS "Enable insert for all users" ON trainers;
DROP POLICY IF EXISTS "Enable update for all users" ON trainers;
DROP POLICY IF EXISTS "Enable delete for all users" ON trainers;

-- Create new policies
CREATE POLICY "Enable read access for all users" ON trainers FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON trainers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON trainers FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON trainers FOR DELETE USING (true);

-- Step 8: Grant permissions
GRANT ALL ON TABLE trainers TO authenticated;
GRANT ALL ON TABLE trainers TO anon;
GRANT ALL ON TABLE trainers TO service_role;

-- Step 9: Verification
SELECT 'Verification complete!' as step;

-- Show all trainers
SELECT id, name, email, specialization, status FROM trainers;

-- Show programs with their trainers
SELECT 
    p.id,
    p.title,
    p.trainer_id,
    t.name as trainer_name,
    t.email as trainer_email
FROM programs p
LEFT JOIN trainers t ON p.trainer_id = t.id;

SELECT 'Foreign key constraint issue resolved!' as message;
