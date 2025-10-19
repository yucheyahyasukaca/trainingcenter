-- Training Center Database Schema
-- Jalankan SQL ini di Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trainers Table
CREATE TABLE IF NOT EXISTS trainers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  bio TEXT,
  experience_years INTEGER NOT NULL DEFAULT 0,
  certification TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  avatar_url TEXT
);

-- Programs/Activities Table
CREATE TABLE IF NOT EXISTS programs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  duration_days INTEGER NOT NULL,
  max_participants INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL
);

-- Participants Table
CREATE TABLE IF NOT EXISTS participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
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

-- Enrollments Table (Junction table for participants and programs)
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  UNIQUE(program_id, participant_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trainers_email ON trainers(email);
CREATE INDEX IF NOT EXISTS idx_trainers_status ON trainers(status);
CREATE INDEX IF NOT EXISTS idx_programs_trainer_id ON programs(trainer_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_category ON programs(category);
CREATE INDEX IF NOT EXISTS idx_programs_dates ON programs(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_program_id ON enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_participant_id ON enrollments(participant_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- Enable Row Level Security (RLS)
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies (untuk development, semua bisa akses. Sesuaikan dengan kebutuhan auth)
CREATE POLICY "Enable read access for all users" ON trainers FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON trainers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON trainers FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON trainers FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON programs FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON programs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON programs FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON programs FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON participants FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON participants FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON participants FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON enrollments FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON enrollments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON enrollments FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON enrollments FOR DELETE USING (true);

-- Insert sample data untuk testing
INSERT INTO trainers (name, email, phone, specialization, bio, experience_years, status) VALUES
('Dr. Budi Santoso', 'budi.santoso@email.com', '081234567890', 'Leadership & Management', 'Praktisi dengan 15 tahun pengalaman di bidang kepemimpinan perusahaan', 15, 'active'),
('Siti Nurhaliza', 'siti.nurhaliza@email.com', '081234567891', 'Digital Marketing', 'Digital Marketing Expert dengan sertifikasi Google & Meta', 8, 'active'),
('Ahmad Dahlan', 'ahmad.dahlan@email.com', '081234567892', 'Software Development', 'Senior Software Engineer dengan keahlian Full Stack Development', 10, 'active');

INSERT INTO programs (title, description, category, duration_days, max_participants, price, status, start_date, end_date, trainer_id) VALUES
('Leadership Excellence Program', 'Program pelatihan kepemimpinan untuk level manajer dan direktur', 'Leadership', 5, 30, 5000000, 'published', '2025-11-01', '2025-11-05', (SELECT id FROM trainers WHERE email = 'budi.santoso@email.com')),
('Digital Marketing Mastery', 'Pelatihan digital marketing dari basic hingga advanced', 'Marketing', 3, 25, 3500000, 'published', '2025-11-10', '2025-11-12', (SELECT id FROM trainers WHERE email = 'siti.nurhaliza@email.com')),
('Full Stack Web Development', 'Bootcamp intensive web development dengan React dan Node.js', 'Technology', 14, 20, 8000000, 'published', '2025-11-15', '2025-11-28', (SELECT id FROM trainers WHERE email = 'ahmad.dahlan@email.com'));

INSERT INTO participants (name, email, phone, company, position, gender, status) VALUES
('Andi Wijaya', 'andi.wijaya@company.com', '081234560001', 'PT ABC Indonesia', 'Manager', 'male', 'active'),
('Dewi Lestari', 'dewi.lestari@company.com', '081234560002', 'PT XYZ Corporation', 'Supervisor', 'female', 'active'),
('Rudi Hermawan', 'rudi.hermawan@company.com', '081234560003', 'CV Maju Jaya', 'Owner', 'male', 'active'),
('Maya Sari', 'maya.sari@company.com', '081234560004', 'PT Digital Solutions', 'Marketing Manager', 'female', 'active');

INSERT INTO enrollments (program_id, participant_id, status, payment_status, amount_paid) VALUES
((SELECT id FROM programs WHERE title = 'Leadership Excellence Program'), (SELECT id FROM participants WHERE email = 'andi.wijaya@company.com'), 'approved', 'paid', 5000000),
((SELECT id FROM programs WHERE title = 'Digital Marketing Mastery'), (SELECT id FROM participants WHERE email = 'dewi.lestari@company.com'), 'approved', 'paid', 3500000),
((SELECT id FROM programs WHERE title = 'Digital Marketing Mastery'), (SELECT id FROM participants WHERE email = 'maya.sari@company.com'), 'approved', 'partial', 2000000),
((SELECT id FROM programs WHERE title = 'Full Stack Web Development'), (SELECT id FROM participants WHERE email = 'rudi.hermawan@company.com'), 'pending', 'unpaid', 0);

