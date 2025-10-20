-- Complete Database Fix
-- This script will create all necessary tables with correct structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'trainer', 'user')),
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT
);

-- Step 2: Create trainers table
CREATE TABLE IF NOT EXISTS trainers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
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

-- Step 3: Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  company VARCHAR(255),
  position VARCHAR(255),
  address TEXT,
  date_of_birth DATE,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- Step 4: Create programs table
CREATE TABLE IF NOT EXISTS programs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  duration_days INTEGER NOT NULL,
  max_participants INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  requirements TEXT,
  learning_objectives TEXT[],
  prerequisites TEXT[]
);

-- Step 5: Create classes table
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

-- Step 6: Create class_trainers table
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

-- Step 7: Create enrollments table with all required columns
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  program_id UUID NOT NULL,
  participant_id UUID NOT NULL,
  class_id UUID,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  completion_date TIMESTAMP WITH TIME ZONE,
  certificate_issued BOOLEAN DEFAULT false,
  payment_proof_url TEXT
);

-- Step 8: Add foreign key constraints
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_program_id_fkey;
ALTER TABLE classes ADD CONSTRAINT classes_program_id_fkey 
FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE;

ALTER TABLE class_trainers DROP CONSTRAINT IF EXISTS class_trainers_class_id_fkey;
ALTER TABLE class_trainers ADD CONSTRAINT class_trainers_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

ALTER TABLE class_trainers DROP CONSTRAINT IF EXISTS class_trainers_trainer_id_fkey;
ALTER TABLE class_trainers ADD CONSTRAINT class_trainers_trainer_id_fkey 
FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE;

ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_program_id_fkey;
ALTER TABLE enrollments ADD CONSTRAINT enrollments_program_id_fkey 
FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE;

ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_participant_id_fkey;
ALTER TABLE enrollments ADD CONSTRAINT enrollments_participant_id_fkey 
FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;

ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_class_id_fkey;
ALTER TABLE enrollments ADD CONSTRAINT enrollments_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;

-- Step 9: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

CREATE INDEX IF NOT EXISTS idx_trainers_email ON trainers(email);
CREATE INDEX IF NOT EXISTS idx_trainers_status ON trainers(status);

CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);

CREATE INDEX IF NOT EXISTS idx_programs_trainer_id ON programs(trainer_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);

CREATE INDEX IF NOT EXISTS idx_classes_program_id ON classes(program_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);

CREATE INDEX IF NOT EXISTS idx_class_trainers_class_id ON class_trainers(class_id);
CREATE INDEX IF NOT EXISTS idx_class_trainers_trainer_id ON class_trainers(trainer_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_program_id ON enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_participant_id ON enrollments(participant_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- Step 10: Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Step 11: Create RLS policies
CREATE POLICY "Enable all access for user_profiles" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Enable all access for trainers" ON trainers FOR ALL USING (true);
CREATE POLICY "Enable all access for participants" ON participants FOR ALL USING (true);
CREATE POLICY "Enable all access for programs" ON programs FOR ALL USING (true);
CREATE POLICY "Enable all access for classes" ON classes FOR ALL USING (true);
CREATE POLICY "Enable all access for class_trainers" ON class_trainers FOR ALL USING (true);
CREATE POLICY "Enable all access for enrollments" ON enrollments FOR ALL USING (true);

-- Step 12: Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon, service_role;

-- Step 13: Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trainers_updated_at BEFORE UPDATE ON trainers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_class_trainers_updated_at BEFORE UPDATE ON class_trainers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 14: Insert sample data
INSERT INTO user_profiles (email, full_name, role, is_active) VALUES
('admin@trainingcenter.com', 'System Administrator', 'admin', true),
('manager@trainingcenter.com', 'Training Manager', 'manager', true),
('budi.santoso@email.com', 'Dr. Budi Santoso', 'trainer', true),
('siti.nurhaliza@email.com', 'Siti Nurhaliza', 'trainer', true),
('ahmad.dahlan@email.com', 'Ahmad Dahlan', 'trainer', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO trainers (user_id, name, email, phone, specialization, bio, experience_years, status) 
SELECT 
    up.id,
    up.full_name,
    up.email,
    '081234567890',
    'General Training',
    'Experienced trainer',
    5,
    'active'
FROM user_profiles up 
WHERE up.role = 'trainer'
ON CONFLICT (email) DO NOTHING;

INSERT INTO participants (user_id, name, email, phone, status) 
SELECT 
    up.id,
    up.full_name,
    up.email,
    '081234567000',
    'active'
FROM user_profiles up 
WHERE up.role = 'user'
ON CONFLICT (email) DO NOTHING;

INSERT INTO programs (title, description, category, duration_days, max_participants, price, status, start_date, end_date, trainer_id, created_by) 
SELECT 
    'Sample Program',
    'This is a sample program for testing',
    'General',
    5,
    20,
    1000000,
    'published',
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '12 days',
    (SELECT id FROM trainers LIMIT 1),
    (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO classes (program_id, name, description, start_date, end_date, start_time, end_time, max_participants, status, location, room)
SELECT 
    p.id,
    'Sample Class',
    'This is a sample class',
    p.start_date,
    p.start_date + INTERVAL '1 day',
    '09:00'::TIME,
    '17:00'::TIME,
    20,
    'scheduled',
    'Training Room',
    'Room 1'
FROM programs p
ON CONFLICT DO NOTHING;

-- Step 15: Verification
SELECT 'Database setup completed successfully!' as message;

-- Check all tables exist
SELECT 
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'trainers', 'participants', 'programs', 'classes', 'class_trainers', 'enrollments')
ORDER BY table_name;

-- Check enrollments table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'enrollments'
ORDER BY ordinal_position;
