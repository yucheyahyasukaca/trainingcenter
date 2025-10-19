-- Update trainer levels system
-- Jalankan di Supabase SQL Editor

-- Add trainer_level column to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS trainer_level VARCHAR(20) DEFAULT 'user' 
CHECK (trainer_level IN ('user', 'trainer_l1', 'trainer_l2', 'master_trainer'));

-- Add trainer_status column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS trainer_status VARCHAR(20) DEFAULT 'inactive' 
CHECK (trainer_status IN ('active', 'inactive', 'suspended'));

-- Add trainer_specializations (JSON array)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS trainer_specializations TEXT[];

-- Add trainer_experience_years
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS trainer_experience_years INTEGER DEFAULT 0;

-- Add trainer_certifications
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS trainer_certifications TEXT;

-- Update existing users with trainer levels
UPDATE user_profiles 
SET 
  trainer_level = CASE 
    WHEN role = 'admin' THEN 'master_trainer'
    WHEN role = 'manager' THEN 'trainer_l2'
    WHEN role = 'user' THEN 'user'
    ELSE 'user'
  END,
  trainer_status = CASE 
    WHEN role IN ('admin', 'manager') THEN 'active'
    ELSE 'inactive'
  END,
  trainer_specializations = CASE 
    WHEN role = 'admin' THEN ARRAY['Leadership', 'Management', 'Technology', 'Marketing']
    WHEN role = 'manager' THEN ARRAY['Management', 'Leadership']
    ELSE ARRAY[]::TEXT[]
  END,
  trainer_experience_years = CASE 
    WHEN role = 'admin' THEN 10
    WHEN role = 'manager' THEN 5
    ELSE 0
  END;

-- Create trainer_programs junction table
CREATE TABLE IF NOT EXISTS trainer_programs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trainer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  UNIQUE(trainer_id, program_id)
);

-- Create user_enrollments table for user program enrollments
CREATE TABLE IF NOT EXISTS user_enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped')),
  completion_date TIMESTAMP WITH TIME ZONE,
  certificate_url TEXT,
  UNIQUE(user_id, program_id)
);

-- Disable RLS for new tables
ALTER TABLE trainer_programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_enrollments DISABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trainer_programs_trainer_id ON trainer_programs(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_programs_program_id ON trainer_programs(program_id);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_user_id ON user_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_program_id ON user_enrollments(program_id);

-- Verify updates
SELECT 
  email, 
  role, 
  trainer_level, 
  trainer_status, 
  trainer_specializations,
  trainer_experience_years
FROM user_profiles 
WHERE email LIKE '%garuda21.com';
