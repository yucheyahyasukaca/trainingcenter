-- Fix Classes Table Error
-- This script will fix the "Gagal menambahkan kelas" error

-- Step 1: Check current state
SELECT 'Checking current state...' as step;

-- Check if classes table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'classes' AND table_schema = 'public')
        THEN 'Classes table exists'
        ELSE 'Classes table does not exist'
    END as classes_status;

-- Check if programs table exists
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

-- Step 2: Create classes table if it doesn't exist
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  program_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  max_participants INTEGER DEFAULT 20,
  current_participants INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('active', 'inactive', 'full', 'completed', 'scheduled', 'ongoing', 'cancelled')),
  location VARCHAR(255),
  room VARCHAR(100),
  materials_needed TEXT[],
  notes TEXT
);

-- Step 3: Create trainers table if it doesn't exist
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

-- Step 4: Create class_trainers junction table
CREATE TABLE IF NOT EXISTS class_trainers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  class_id UUID NOT NULL,
  trainer_id UUID NOT NULL,
  role VARCHAR(50) DEFAULT 'instructor' CHECK (role IN ('instructor', 'assistant', 'mentor', 'coach')),
  is_primary BOOLEAN DEFAULT false,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(class_id, trainer_id)
);

-- Step 5: Drop existing foreign key constraints if they exist
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_program_id_fkey;
ALTER TABLE class_trainers DROP CONSTRAINT IF EXISTS class_trainers_class_id_fkey;
ALTER TABLE class_trainers DROP CONSTRAINT IF EXISTS class_trainers_trainer_id_fkey;

-- Step 6: Add foreign key constraints
ALTER TABLE classes 
ADD CONSTRAINT classes_program_id_fkey 
FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE;

ALTER TABLE class_trainers 
ADD CONSTRAINT class_trainers_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

ALTER TABLE class_trainers 
ADD CONSTRAINT class_trainers_trainer_id_fkey 
FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE;

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classes_program_id ON classes(program_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_dates ON classes(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_class_trainers_class_id ON class_trainers(class_id);
CREATE INDEX IF NOT EXISTS idx_class_trainers_trainer_id ON class_trainers(trainer_id);

-- Step 8: Enable Row Level Security
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_trainers ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies
-- Classes policies
DROP POLICY IF EXISTS "Enable read access for all users" ON classes;
DROP POLICY IF EXISTS "Enable insert for all users" ON classes;
DROP POLICY IF EXISTS "Enable update for all users" ON classes;
DROP POLICY IF EXISTS "Enable delete for all users" ON classes;

CREATE POLICY "Enable read access for all users" ON classes FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON classes FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON classes FOR DELETE USING (true);

-- Trainers policies
DROP POLICY IF EXISTS "Enable read access for all users" ON trainers;
DROP POLICY IF EXISTS "Enable insert for all users" ON trainers;
DROP POLICY IF EXISTS "Enable update for all users" ON trainers;
DROP POLICY IF EXISTS "Enable delete for all users" ON trainers;

CREATE POLICY "Enable read access for all users" ON trainers FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON trainers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON trainers FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON trainers FOR DELETE USING (true);

-- Class trainers policies
DROP POLICY IF EXISTS "Enable read access for all users" ON class_trainers;
DROP POLICY IF EXISTS "Enable insert for all users" ON class_trainers;
DROP POLICY IF EXISTS "Enable update for all users" ON class_trainers;
DROP POLICY IF EXISTS "Enable delete for all users" ON class_trainers;

CREATE POLICY "Enable read access for all users" ON class_trainers FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON class_trainers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON class_trainers FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON class_trainers FOR DELETE USING (true);

-- Step 10: Grant permissions
GRANT ALL ON TABLE classes TO authenticated;
GRANT ALL ON TABLE classes TO anon;
GRANT ALL ON TABLE classes TO service_role;

GRANT ALL ON TABLE trainers TO authenticated;
GRANT ALL ON TABLE trainers TO anon;
GRANT ALL ON TABLE trainers TO service_role;

GRANT ALL ON TABLE class_trainers TO authenticated;
GRANT ALL ON TABLE class_trainers TO anon;
GRANT ALL ON TABLE class_trainers TO service_role;

-- Step 11: Insert sample data for testing
-- Insert sample trainers
INSERT INTO trainers (name, email, phone, specialization, bio, experience_years, status) 
VALUES 
('Dr. Budi Santoso', 'budi.santoso@email.com', '081234567890', 'Leadership & Management', 'Praktisi dengan 15 tahun pengalaman', 15, 'active'),
('Siti Nurhaliza', 'siti.nurhaliza@email.com', '081234567891', 'Digital Marketing', 'Digital Marketing Expert', 8, 'active'),
('Ahmad Dahlan', 'ahmad.dahlan@email.com', '081234567892', 'Software Development', 'Senior Software Engineer', 10, 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert sample classes for existing programs
INSERT INTO classes (program_id, name, description, start_date, end_date, start_time, end_time, max_participants, status, location, room)
SELECT 
    p.id,
    'Session 1: ' || p.title,
    'First session of ' || p.title,
    p.start_date,
    p.start_date + INTERVAL '1 day',
    '09:00'::TIME,
    '17:00'::TIME,
    20,
    'scheduled',
    'Training Center',
    'Room A'
FROM programs p
WHERE p.id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 12: Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
DROP TRIGGER IF EXISTS update_trainers_updated_at ON trainers;
DROP TRIGGER IF EXISTS update_class_trainers_updated_at ON class_trainers;

CREATE TRIGGER update_classes_updated_at 
    BEFORE UPDATE ON classes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainers_updated_at 
    BEFORE UPDATE ON trainers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_trainers_updated_at 
    BEFORE UPDATE ON class_trainers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 13: Verification
SELECT 'Verification complete!' as step;

-- Check if all tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('classes', 'trainers', 'class_trainers', 'programs')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('classes', 'trainers', 'class_trainers', 'programs')
ORDER BY table_name;

-- Check sample data
SELECT 'Sample classes:' as info;
SELECT id, name, program_id, status FROM classes LIMIT 5;

SELECT 'Sample trainers:' as info;
SELECT id, name, email, specialization FROM trainers LIMIT 5;

SELECT 'Classes table setup completed successfully!' as message;
