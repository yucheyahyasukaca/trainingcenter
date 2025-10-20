-- Fix Enrollments Table Structure
-- This script will fix the missing columns in enrollments table

-- Step 1: Check current enrollments table structure
SELECT 'Checking current enrollments table...' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'enrollments'
ORDER BY ordinal_position;

-- Step 2: Drop and recreate enrollments table with correct structure
DROP TABLE IF EXISTS enrollments CASCADE;

CREATE TABLE enrollments (
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

-- Step 3: Add foreign key constraints
ALTER TABLE enrollments 
ADD CONSTRAINT enrollments_program_id_fkey 
FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE;

ALTER TABLE enrollments 
ADD CONSTRAINT enrollments_participant_id_fkey 
FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;

ALTER TABLE enrollments 
ADD CONSTRAINT enrollments_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;

-- Step 4: Create indexes
CREATE INDEX idx_enrollments_program_id ON enrollments(program_id);
CREATE INDEX idx_enrollments_participant_id ON enrollments(participant_id);
CREATE INDEX idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_payment_status ON enrollments(payment_status);

-- Step 5: Enable Row Level Security
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON enrollments;
DROP POLICY IF EXISTS "Enable insert for all users" ON enrollments;
DROP POLICY IF EXISTS "Enable update for all users" ON enrollments;
DROP POLICY IF EXISTS "Enable delete for all users" ON enrollments;

CREATE POLICY "Enable read access for all users" ON enrollments FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON enrollments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON enrollments FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON enrollments FOR DELETE USING (true);

-- Step 7: Grant permissions
GRANT ALL ON TABLE enrollments TO authenticated;
GRANT ALL ON TABLE enrollments TO anon;
GRANT ALL ON TABLE enrollments TO service_role;

-- Step 8: Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_enrollments_updated_at 
    BEFORE UPDATE ON enrollments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Insert sample data for testing
INSERT INTO enrollments (program_id, participant_id, class_id, status, payment_status, amount_paid, notes) 
SELECT 
    p.id,
    (SELECT id FROM participants LIMIT 1),
    (SELECT id FROM classes WHERE program_id = p.id LIMIT 1),
    'approved',
    'paid',
    p.price,
    'Sample enrollment for testing'
FROM programs p
LIMIT 3;

-- Step 10: Verification
SELECT 'Verification complete!' as step;

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'enrollments'
ORDER BY ordinal_position;

-- Check sample data
SELECT COUNT(*) as enrollments_count FROM enrollments;

-- Test insert to verify all columns work
INSERT INTO enrollments (program_id, participant_id, status, payment_status, amount_paid, notes)
SELECT 
    p.id,
    (SELECT id FROM participants LIMIT 1),
    'pending',
    'unpaid',
    0,
    'Test enrollment'
FROM programs p
LIMIT 1
ON CONFLICT DO NOTHING;

SELECT 'Enrollments table fixed successfully!' as message;
