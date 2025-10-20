-- Quick Fix for Classes Table
-- This script will quickly fix the "Gagal menambahkan kelas" error

-- Step 1: Create classes table
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

-- Step 2: Create trainers table if not exists
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

-- Step 3: Create class_trainers table
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

-- Step 4: Add foreign key constraints
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_program_id_fkey;
ALTER TABLE classes ADD CONSTRAINT classes_program_id_fkey 
FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE;

ALTER TABLE class_trainers DROP CONSTRAINT IF EXISTS class_trainers_class_id_fkey;
ALTER TABLE class_trainers ADD CONSTRAINT class_trainers_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

ALTER TABLE class_trainers DROP CONSTRAINT IF EXISTS class_trainers_trainer_id_fkey;
ALTER TABLE class_trainers ADD CONSTRAINT class_trainers_trainer_id_fkey 
FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE;

-- Step 5: Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_trainers ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policies
CREATE POLICY "Enable all access for classes" ON classes FOR ALL USING (true);
CREATE POLICY "Enable all access for trainers" ON trainers FOR ALL USING (true);
CREATE POLICY "Enable all access for class_trainers" ON class_trainers FOR ALL USING (true);

-- Step 7: Grant permissions
GRANT ALL ON TABLE classes TO authenticated, anon, service_role;
GRANT ALL ON TABLE trainers TO authenticated, anon, service_role;
GRANT ALL ON TABLE class_trainers TO authenticated, anon, service_role;

-- Step 8: Insert sample data
INSERT INTO trainers (name, email, phone, specialization, bio, experience_years, status) 
VALUES 
('Default Trainer', 'default@trainer.com', '081234567000', 'General Training', 'Default trainer for classes', 5, 'active')
ON CONFLICT (email) DO NOTHING;

-- Step 9: Test insert a sample class
INSERT INTO classes (program_id, name, description, start_date, end_date, start_time, end_time, max_participants, status, location, room)
SELECT 
    p.id,
    'Test Class',
    'Test class description',
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '2 days',
    '09:00'::TIME,
    '17:00'::TIME,
    20,
    'scheduled',
    'Training Room',
    'Room 1'
FROM programs p
LIMIT 1
ON CONFLICT DO NOTHING;

-- Step 10: Verification
SELECT 'Classes table created successfully!' as message;
SELECT COUNT(*) as classes_count FROM classes;
SELECT COUNT(*) as trainers_count FROM trainers;
