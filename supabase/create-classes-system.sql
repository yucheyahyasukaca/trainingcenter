-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 10,
  current_participants INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'full', 'completed')),
  location VARCHAR(255),
  room VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create class_trainers table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS class_trainers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'instructor' CHECK (role IN ('instructor', 'assistant', 'mentor')),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, trainer_id)
);

-- Update enrollments table to include class_id
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classes_program_id ON classes(program_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_class_trainers_class_id ON class_trainers(class_id);
CREATE INDEX IF NOT EXISTS idx_class_trainers_trainer_id ON class_trainers(trainer_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);

-- Create function to update current_participants count
CREATE OR REPLACE FUNCTION update_class_participants_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE classes 
    SET current_participants = current_participants + 1,
        status = CASE 
          WHEN current_participants + 1 >= max_participants THEN 'full'
          ELSE 'active'
        END
    WHERE id = NEW.class_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE classes 
    SET current_participants = current_participants - 1,
        status = CASE 
          WHEN current_participants - 1 < max_participants THEN 'active'
          ELSE status
        END
    WHERE id = OLD.class_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle class change
    IF OLD.class_id != NEW.class_id THEN
      -- Decrease old class count
      UPDATE classes 
      SET current_participants = current_participants - 1,
          status = CASE 
            WHEN current_participants - 1 < max_participants THEN 'active'
            ELSE status
          END
      WHERE id = OLD.class_id;
      
      -- Increase new class count
      UPDATE classes 
      SET current_participants = current_participants + 1,
          status = CASE 
            WHEN current_participants + 1 >= max_participants THEN 'full'
            ELSE 'active'
          END
      WHERE id = NEW.class_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic participant count updates
CREATE TRIGGER trigger_update_class_participants_on_enrollment
  AFTER INSERT OR UPDATE OR DELETE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_class_participants_count();

-- Create RLS policies
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_trainers ENABLE ROW LEVEL SECURITY;

-- RLS policies for classes
CREATE POLICY "Classes are viewable by authenticated users" ON classes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Classes are manageable by admins and managers" ON classes
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'manager')
    )
  );

-- RLS policies for class_trainers
CREATE POLICY "Class trainers are viewable by authenticated users" ON class_trainers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Class trainers are manageable by admins and managers" ON class_trainers
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'manager')
    )
  );

-- Insert sample classes for existing programs
INSERT INTO classes (program_id, name, description, start_date, end_date, start_time, end_time, max_participants, location, room)
SELECT 
  p.id,
  p.title || ' - Kelas A',
  'Kelas pagi untuk ' || p.title,
  p.start_date,
  p.end_date,
  '09:00'::TIME,
  '12:00'::TIME,
  FLOOR(p.max_participants / 2),
  'Gedung A - Lantai 1',
  'Ruang 101'
FROM programs p
WHERE p.id IN (SELECT id FROM programs LIMIT 3);

INSERT INTO classes (program_id, name, description, start_date, end_date, start_time, end_time, max_participants, location, room)
SELECT 
  p.id,
  p.title || ' - Kelas B',
  'Kelas siang untuk ' || p.title,
  p.start_date,
  p.end_date,
  '13:00'::TIME,
  '16:00'::TIME,
  FLOOR(p.max_participants / 2),
  'Gedung A - Lantai 2',
  'Ruang 201'
FROM programs p
WHERE p.id IN (SELECT id FROM programs LIMIT 3);

-- Assign trainers to classes
INSERT INTO class_trainers (class_id, trainer_id, role, is_primary)
SELECT 
  c.id,
  t.id,
  'instructor',
  true
FROM classes c
CROSS JOIN (
  SELECT id FROM trainers LIMIT 3
) t
WHERE c.id IN (SELECT id FROM classes LIMIT 6);
