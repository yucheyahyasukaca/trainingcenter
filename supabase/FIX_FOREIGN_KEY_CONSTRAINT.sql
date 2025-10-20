-- Fix Foreign Key Constraint Error
-- This script will fix the foreign key constraint issue between programs and trainers

-- First, let's check the current state of both tables
SELECT 'Checking programs table...' as status;
SELECT COUNT(*) as programs_count FROM programs;

SELECT 'Checking trainers table...' as status;
SELECT COUNT(*) as trainers_count FROM trainers;

-- Check if there are any programs with invalid trainer_id
SELECT 'Checking invalid trainer references...' as status;
SELECT 
    p.id,
    p.title,
    p.trainer_id,
    CASE 
        WHEN t.id IS NULL THEN 'INVALID TRAINER ID'
        ELSE 'VALID TRAINER ID'
    END as trainer_status
FROM programs p
LEFT JOIN trainers t ON p.trainer_id = t.id
WHERE p.trainer_id IS NOT NULL;

-- Option 1: Temporarily disable foreign key constraint
-- This allows us to fix the data without constraint violations
ALTER TABLE programs DROP CONSTRAINT IF EXISTS programs_trainer_id_fkey;

-- Now let's ensure we have valid trainers
-- Create trainers table if it doesn't exist
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

-- Insert sample trainers if they don't exist
INSERT INTO trainers (id, name, email, phone, specialization, bio, experience_years, certification, status, hourly_rate, skills, languages) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Dr. Budi Santoso', 'budi.santoso@email.com', '081234567890', 'Leadership & Management', 'Praktisi dengan 15 tahun pengalaman di bidang kepemimpinan perusahaan', 15, 'Certified Executive Coach (CEC), PMP', 'active', 500000, ARRAY['Leadership', 'Strategic Planning', 'Team Building'], ARRAY['Indonesian', 'English']),
('550e8400-e29b-41d4-a716-446655440002', 'Siti Nurhaliza', 'siti.nurhaliza@email.com', '081234567891', 'Digital Marketing', 'Digital Marketing Expert dengan sertifikasi Google & Meta', 8, 'Google Ads Certified, Meta Blueprint Certified', 'active', 400000, ARRAY['Digital Marketing', 'Social Media', 'Content Strategy'], ARRAY['Indonesian', 'English']),
('550e8400-e29b-41d4-a716-446655440003', 'Ahmad Dahlan', 'ahmad.dahlan@email.com', '081234567892', 'Software Development', 'Senior Software Engineer dengan keahlian Full Stack Development', 10, 'AWS Certified Developer, Microsoft Azure', 'active', 600000, ARRAY['JavaScript', 'React', 'Node.js', 'Python'], ARRAY['Indonesian', 'English'])
ON CONFLICT (email) DO NOTHING;

-- Update programs table to fix invalid trainer references
-- Set trainer_id to NULL for programs with invalid trainer references
UPDATE programs 
SET trainer_id = NULL 
WHERE trainer_id IS NOT NULL 
AND trainer_id NOT IN (SELECT id FROM trainers);

-- Or assign a default trainer to programs with invalid references
UPDATE programs 
SET trainer_id = (SELECT id FROM trainers WHERE email = 'budi.santoso@email.com' LIMIT 1)
WHERE trainer_id IS NOT NULL 
AND trainer_id NOT IN (SELECT id FROM trainers);

-- Now recreate the foreign key constraint
ALTER TABLE programs 
ADD CONSTRAINT programs_trainer_id_fkey 
FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL;

-- Enable Row Level Security on trainers if not already enabled
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trainers
DROP POLICY IF EXISTS "Enable read access for all users" ON trainers;
DROP POLICY IF EXISTS "Enable insert for all users" ON trainers;
DROP POLICY IF EXISTS "Enable update for all users" ON trainers;
DROP POLICY IF EXISTS "Enable delete for all users" ON trainers;

CREATE POLICY "Enable read access for all users" ON trainers FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON trainers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON trainers FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON trainers FOR DELETE USING (true);

-- Grant permissions
GRANT ALL ON TABLE trainers TO authenticated;
GRANT ALL ON TABLE trainers TO anon;
GRANT ALL ON TABLE trainers TO service_role;

-- Verify the fix
SELECT 'Verification...' as status;

-- Check programs with valid trainer references
SELECT 
    p.id,
    p.title,
    p.trainer_id,
    t.name as trainer_name,
    t.email as trainer_email
FROM programs p
LEFT JOIN trainers t ON p.trainer_id = t.id;

-- Check trainers count
SELECT COUNT(*) as total_trainers FROM trainers;

-- Check programs count
SELECT COUNT(*) as total_programs FROM programs;

SELECT 'Foreign key constraint fixed successfully!' as message;
