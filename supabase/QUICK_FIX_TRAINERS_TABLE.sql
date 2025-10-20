-- Quick Fix: Create Trainers Table
-- Run this script first to fix the immediate 404 error

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trainers_email ON trainers(email);
CREATE INDEX IF NOT EXISTS idx_trainers_status ON trainers(status);
CREATE INDEX IF NOT EXISTS idx_trainers_specialization ON trainers(specialization);

-- Enable Row Level Security
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now)
CREATE POLICY "Enable read access for all users" ON trainers FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON trainers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON trainers FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON trainers FOR DELETE USING (true);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamps
CREATE TRIGGER update_trainers_updated_at 
    BEFORE UPDATE ON trainers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample trainers for testing
INSERT INTO trainers (name, email, phone, specialization, bio, experience_years, certification, status, hourly_rate, skills, languages) VALUES
('Dr. Budi Santoso', 'budi.santoso@email.com', '081234567890', 'Leadership & Management', 'Praktisi dengan 15 tahun pengalaman di bidang kepemimpinan perusahaan', 15, 'Certified Executive Coach (CEC), PMP', 'active', 500000, ARRAY['Leadership', 'Strategic Planning', 'Team Building'], ARRAY['Indonesian', 'English']),
('Siti Nurhaliza', 'siti.nurhaliza@email.com', '081234567891', 'Digital Marketing', 'Digital Marketing Expert dengan sertifikasi Google & Meta', 8, 'Google Ads Certified, Meta Blueprint Certified', 'active', 400000, ARRAY['Digital Marketing', 'Social Media', 'Content Strategy'], ARRAY['Indonesian', 'English']),
('Ahmad Dahlan', 'ahmad.dahlan@email.com', '081234567892', 'Software Development', 'Senior Software Engineer dengan keahlian Full Stack Development', 10, 'AWS Certified Developer, Microsoft Azure', 'active', 600000, ARRAY['JavaScript', 'React', 'Node.js', 'Python'], ARRAY['Indonesian', 'English'])
ON CONFLICT (email) DO NOTHING;

-- Grant permissions
GRANT ALL ON TABLE trainers TO authenticated;
GRANT ALL ON SEQUENCE trainers_id_seq TO authenticated;

-- Success message
SELECT 'Trainers table created successfully!' as message;
