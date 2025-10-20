-- Complete Trainer System Setup
-- This script creates all necessary tables and relationships for the trainer system
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS class_trainers CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS trainers CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table first (referenced by trainers)
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

-- Create trainers table
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

-- Create participants table
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

-- Create programs table
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

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
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

-- Create class_trainers junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS class_trainers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) DEFAULT 'instructor' CHECK (role IN ('instructor', 'assistant', 'mentor', 'coach')),
  is_primary BOOLEAN DEFAULT false,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(class_id, trainer_id)
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  completion_date TIMESTAMP WITH TIME ZONE,
  certificate_issued BOOLEAN DEFAULT false,
  UNIQUE(program_id, participant_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_trainers_email ON trainers(email);
CREATE INDEX IF NOT EXISTS idx_trainers_status ON trainers(status);
CREATE INDEX IF NOT EXISTS idx_trainers_user_id ON trainers(user_id);
CREATE INDEX IF NOT EXISTS idx_trainers_specialization ON trainers(specialization);

CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);

CREATE INDEX IF NOT EXISTS idx_programs_trainer_id ON programs(trainer_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_category ON programs(category);
CREATE INDEX IF NOT EXISTS idx_programs_dates ON programs(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_programs_created_by ON programs(created_by);

CREATE INDEX IF NOT EXISTS idx_classes_program_id ON classes(program_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_dates ON classes(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_class_trainers_class_id ON class_trainers(class_id);
CREATE INDEX IF NOT EXISTS idx_class_trainers_trainer_id ON class_trainers(trainer_id);
CREATE INDEX IF NOT EXISTS idx_class_trainers_role ON class_trainers(role);

CREATE INDEX IF NOT EXISTS idx_enrollments_program_id ON enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_participant_id ON enrollments(participant_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_status ON enrollments(payment_status);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Enable read access for all users" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON user_profiles FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON user_profiles FOR DELETE USING (true);

-- Create RLS policies for trainers
CREATE POLICY "Enable read access for all users" ON trainers FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON trainers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON trainers FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON trainers FOR DELETE USING (true);

-- Create RLS policies for participants
CREATE POLICY "Enable read access for all users" ON participants FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON participants FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON participants FOR DELETE USING (true);

-- Create RLS policies for programs
CREATE POLICY "Enable read access for all users" ON programs FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON programs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON programs FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON programs FOR DELETE USING (true);

-- Create RLS policies for classes
CREATE POLICY "Enable read access for all users" ON classes FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON classes FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON classes FOR DELETE USING (true);

-- Create RLS policies for class_trainers
CREATE POLICY "Enable read access for all users" ON class_trainers FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON class_trainers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON class_trainers FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON class_trainers FOR DELETE USING (true);

-- Create RLS policies for enrollments
CREATE POLICY "Enable read access for all users" ON enrollments FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON enrollments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON enrollments FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON enrollments FOR DELETE USING (true);

-- Insert sample user profiles
INSERT INTO user_profiles (email, full_name, role, is_active) VALUES
('admin@trainingcenter.com', 'System Administrator', 'admin', true),
('manager@trainingcenter.com', 'Training Manager', 'manager', true),
('budi.santoso@email.com', 'Dr. Budi Santoso', 'trainer', true),
('siti.nurhaliza@email.com', 'Siti Nurhaliza', 'trainer', true),
('ahmad.dahlan@email.com', 'Ahmad Dahlan', 'trainer', true),
('andi.wijaya@company.com', 'Andi Wijaya', 'user', true),
('dewi.lestari@company.com', 'Dewi Lestari', 'user', true);

-- Insert sample trainers
INSERT INTO trainers (user_id, name, email, phone, specialization, bio, experience_years, certification, status, hourly_rate, skills, languages) VALUES
((SELECT id FROM user_profiles WHERE email = 'budi.santoso@email.com'), 'Dr. Budi Santoso', 'budi.santoso@email.com', '081234567890', 'Leadership & Management', 'Praktisi dengan 15 tahun pengalaman di bidang kepemimpinan perusahaan', 15, 'Certified Executive Coach (CEC), PMP', 'active', 500000, ARRAY['Leadership', 'Strategic Planning', 'Team Building'], ARRAY['Indonesian', 'English']),
((SELECT id FROM user_profiles WHERE email = 'siti.nurhaliza@email.com'), 'Siti Nurhaliza', 'siti.nurhaliza@email.com', '081234567891', 'Digital Marketing', 'Digital Marketing Expert dengan sertifikasi Google & Meta', 8, 'Google Ads Certified, Meta Blueprint Certified', 'active', 400000, ARRAY['Digital Marketing', 'Social Media', 'Content Strategy'], ARRAY['Indonesian', 'English']),
((SELECT id FROM user_profiles WHERE email = 'ahmad.dahlan@email.com'), 'Ahmad Dahlan', 'ahmad.dahlan@email.com', '081234567892', 'Software Development', 'Senior Software Engineer dengan keahlian Full Stack Development', 10, 'AWS Certified Developer, Microsoft Azure', 'active', 600000, ARRAY['JavaScript', 'React', 'Node.js', 'Python'], ARRAY['Indonesian', 'English']);

-- Insert sample participants
INSERT INTO participants (user_id, name, email, phone, company, position, gender, status) VALUES
((SELECT id FROM user_profiles WHERE email = 'andi.wijaya@company.com'), 'Andi Wijaya', 'andi.wijaya@company.com', '081234560001', 'PT ABC Indonesia', 'Manager', 'male', 'active'),
((SELECT id FROM user_profiles WHERE email = 'dewi.lestari@company.com'), 'Dewi Lestari', 'dewi.lestari@company.com', '081234560002', 'PT XYZ Corporation', 'Supervisor', 'female', 'active'),
('rudi.hermawan@company.com', 'Rudi Hermawan', 'rudi.hermawan@company.com', '081234560003', 'CV Maju Jaya', 'Owner', 'male', 'active'),
('maya.sari@company.com', 'Maya Sari', 'maya.sari@company.com', '081234560004', 'PT Digital Solutions', 'Marketing Manager', 'female', 'active');

-- Insert sample programs
INSERT INTO programs (title, description, category, duration_days, max_participants, price, status, start_date, end_date, trainer_id, created_by, requirements, learning_objectives, prerequisites) VALUES
('Leadership Excellence Program', 'Program pelatihan kepemimpinan untuk level manajer dan direktur', 'Leadership', 5, 30, 5000000, 'published', '2025-11-01', '2025-11-05', (SELECT id FROM trainers WHERE email = 'budi.santoso@email.com'), (SELECT id FROM user_profiles WHERE role = 'admin'), 'Minimal 3 tahun pengalaman manajerial', ARRAY['Menguasai teknik kepemimpinan', 'Mampu mengelola tim efektif', 'Mengembangkan strategi bisnis'], ARRAY['Pengalaman manajerial minimal 2 tahun']),
('Digital Marketing Mastery', 'Pelatihan digital marketing dari basic hingga advanced', 'Marketing', 3, 25, 3500000, 'published', '2025-11-10', '2025-11-12', (SELECT id FROM trainers WHERE email = 'siti.nurhaliza@email.com'), (SELECT id FROM user_profiles WHERE role = 'admin'), 'Basic knowledge of marketing', ARRAY['Menguasai platform digital marketing', 'Mampu membuat campaign efektif', 'Analisis performa marketing'], ARRAY['Basic marketing knowledge']),
('Full Stack Web Development', 'Bootcamp intensive web development dengan React dan Node.js', 'Technology', 14, 20, 8000000, 'published', '2025-11-15', '2025-11-28', (SELECT id FROM trainers WHERE email = 'ahmad.dahlan@email.com'), (SELECT id FROM user_profiles WHERE role = 'admin'), 'Basic programming knowledge', ARRAY['Menguasai React dan Node.js', 'Mampu membuat aplikasi full stack', 'Deploy aplikasi ke cloud'], ARRAY['Basic programming knowledge']);

-- Insert sample classes
INSERT INTO classes (program_id, name, description, start_date, end_date, start_time, end_time, max_participants, status, location, room, materials_needed) VALUES
((SELECT id FROM programs WHERE title = 'Leadership Excellence Program'), 'Session 1: Leadership Fundamentals', 'Pengenalan konsep dasar kepemimpinan', '2025-11-01', '2025-11-01', '09:00', '17:00', 30, 'scheduled', 'Training Center Jakarta', 'Room A', ARRAY['Laptop', 'Notebook', 'Handout']),
((SELECT id FROM programs WHERE title = 'Leadership Excellence Program'), 'Session 2: Team Management', 'Teknik mengelola dan memotivasi tim', '2025-11-02', '2025-11-02', '09:00', '17:00', 30, 'scheduled', 'Training Center Jakarta', 'Room A', ARRAY['Laptop', 'Notebook', 'Handout']),
((SELECT id FROM programs WHERE title = 'Digital Marketing Mastery'), 'Session 1: Digital Marketing Basics', 'Pengenalan digital marketing dan strategi', '2025-11-10', '2025-11-10', '09:00', '17:00', 25, 'scheduled', 'Training Center Jakarta', 'Room B', ARRAY['Laptop', 'Notebook', 'Handout']),
((SELECT id FROM programs WHERE title = 'Full Stack Web Development'), 'Session 1: HTML/CSS Fundamentals', 'Pengenalan HTML dan CSS', '2025-11-15', '2025-11-15', '09:00', '17:00', 20, 'scheduled', 'Training Center Jakarta', 'Room C', ARRAY['Laptop', 'Code Editor', 'Handout']);

-- Insert class-trainer relationships
INSERT INTO class_trainers (class_id, trainer_id, role, is_primary) VALUES
((SELECT id FROM classes WHERE name = 'Session 1: Leadership Fundamentals'), (SELECT id FROM trainers WHERE email = 'budi.santoso@email.com'), 'instructor', true),
((SELECT id FROM classes WHERE name = 'Session 2: Team Management'), (SELECT id FROM trainers WHERE email = 'budi.santoso@email.com'), 'instructor', true),
((SELECT id FROM classes WHERE name = 'Session 1: Digital Marketing Basics'), (SELECT id FROM trainers WHERE email = 'siti.nurhaliza@email.com'), 'instructor', true),
((SELECT id FROM classes WHERE name = 'Session 1: HTML/CSS Fundamentals'), (SELECT id FROM trainers WHERE email = 'ahmad.dahlan@email.com'), 'instructor', true);

-- Insert sample enrollments
INSERT INTO enrollments (program_id, participant_id, class_id, status, payment_status, amount_paid) VALUES
((SELECT id FROM programs WHERE title = 'Leadership Excellence Program'), (SELECT id FROM participants WHERE email = 'andi.wijaya@company.com'), (SELECT id FROM classes WHERE name = 'Session 1: Leadership Fundamentals'), 'approved', 'paid', 5000000),
((SELECT id FROM programs WHERE title = 'Digital Marketing Mastery'), (SELECT id FROM participants WHERE email = 'dewi.lestari@company.com'), (SELECT id FROM classes WHERE name = 'Session 1: Digital Marketing Basics'), 'approved', 'paid', 3500000),
((SELECT id FROM programs WHERE title = 'Digital Marketing Mastery'), (SELECT id FROM participants WHERE email = 'maya.sari@company.com'), (SELECT id FROM classes WHERE name = 'Session 1: Digital Marketing Basics'), 'approved', 'partial', 2000000),
((SELECT id FROM programs WHERE title = 'Full Stack Web Development'), (SELECT id FROM participants WHERE email = 'rudi.hermawan@company.com'), (SELECT id FROM classes WHERE name = 'Session 1: HTML/CSS Fundamentals'), 'pending', 'unpaid', 0);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trainers_updated_at BEFORE UPDATE ON trainers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_class_trainers_updated_at BEFORE UPDATE ON class_trainers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for trainer statistics
CREATE OR REPLACE VIEW trainer_statistics AS
SELECT 
    t.id,
    t.name,
    t.email,
    t.specialization,
    COUNT(DISTINCT ct.class_id) as total_classes,
    COUNT(DISTINCT p.id) as total_programs,
    COUNT(DISTINCT e.id) as total_enrollments,
    AVG(t.hourly_rate) as avg_hourly_rate,
    t.status
FROM trainers t
LEFT JOIN class_trainers ct ON t.id = ct.trainer_id
LEFT JOIN classes c ON ct.class_id = c.id
LEFT JOIN programs p ON c.program_id = p.id
LEFT JOIN enrollments e ON p.id = e.program_id
GROUP BY t.id, t.name, t.email, t.specialization, t.status;

-- Create view for program with trainer details
CREATE OR REPLACE VIEW programs_with_trainers AS
SELECT 
    p.*,
    t.name as trainer_name,
    t.email as trainer_email,
    t.specialization as trainer_specialization,
    t.experience_years as trainer_experience,
    COUNT(DISTINCT c.id) as total_classes,
    COUNT(DISTINCT e.id) as total_enrollments
FROM programs p
LEFT JOIN trainers t ON p.trainer_id = t.id
LEFT JOIN classes c ON p.id = c.program_id
LEFT JOIN enrollments e ON p.id = e.program_id
GROUP BY p.id, t.id, t.name, t.email, t.specialization, t.experience_years;

-- Create view for class with trainer details
CREATE OR REPLACE VIEW classes_with_trainers AS
SELECT 
    c.*,
    p.title as program_title,
    p.category as program_category,
    STRING_AGG(t.name, ', ') as trainer_names,
    STRING_AGG(ct.role, ', ') as trainer_roles,
    COUNT(DISTINCT e.id) as enrolled_participants
FROM classes c
LEFT JOIN programs p ON c.program_id = p.id
LEFT JOIN class_trainers ct ON c.id = ct.class_id
LEFT JOIN trainers t ON ct.trainer_id = t.id
LEFT JOIN enrollments e ON c.id = e.class_id
GROUP BY c.id, p.title, p.category;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Success message
SELECT 'Trainer system setup completed successfully!' as message;
