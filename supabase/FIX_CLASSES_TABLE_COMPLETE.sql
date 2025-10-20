-- ============================================================================
-- COMPLETE FIX FOR CLASSES TABLE AND ADD CLASS FUNCTIONALITY
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script fixes:
-- 1. Ensures classes table exists with correct schema
-- 2. Ensures class_trainers table exists
-- 3. Sets up proper RLS policies
-- 4. Creates sample data for Data Science program
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE CLASSES TABLE IF NOT EXISTS
-- ============================================================================

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
    max_participants INTEGER DEFAULT 20 NOT NULL,
    current_participants INTEGER DEFAULT 0 NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'full', 'completed', 'scheduled', 'ongoing', 'cancelled')),
    location VARCHAR(255),
    room VARCHAR(100)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_classes_program_id ON classes(program_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_dates ON classes(start_date, end_date);

-- ============================================================================
-- STEP 2: CREATE CLASS_TRAINERS TABLE IF NOT EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS class_trainers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
    trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(50) DEFAULT 'instructor',
    is_primary BOOLEAN DEFAULT false,
    UNIQUE(class_id, trainer_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_class_trainers_class_id ON class_trainers(class_id);
CREATE INDEX IF NOT EXISTS idx_class_trainers_trainer_id ON class_trainers(trainer_id);

-- ============================================================================
-- STEP 3: ENABLE RLS ON CLASSES AND CLASS_TRAINERS
-- ============================================================================

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_trainers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: DROP EXISTING POLICIES (IF ANY)
-- ============================================================================

-- Drop classes policies
DROP POLICY IF EXISTS "classes_select_all" ON classes;
DROP POLICY IF EXISTS "classes_insert_all" ON classes;
DROP POLICY IF EXISTS "classes_update_all" ON classes;
DROP POLICY IF EXISTS "classes_delete_all" ON classes;

DROP POLICY IF EXISTS "Enable read access for all users" ON classes;
DROP POLICY IF EXISTS "Enable insert for all users" ON classes;
DROP POLICY IF EXISTS "Enable update for all users" ON classes;
DROP POLICY IF EXISTS "Enable delete for all users" ON classes;

-- Drop class_trainers policies
DROP POLICY IF EXISTS "class_trainers_select_all" ON class_trainers;
DROP POLICY IF EXISTS "class_trainers_insert_all" ON class_trainers;
DROP POLICY IF EXISTS "class_trainers_update_all" ON class_trainers;
DROP POLICY IF EXISTS "class_trainers_delete_all" ON class_trainers;

DROP POLICY IF EXISTS "Enable read access for all users" ON class_trainers;
DROP POLICY IF EXISTS "Enable insert for all users" ON class_trainers;
DROP POLICY IF EXISTS "Enable update for all users" ON class_trainers;
DROP POLICY IF EXISTS "Enable delete for all users" ON class_trainers;

-- ============================================================================
-- STEP 5: CREATE NEW SIMPLE POLICIES
-- ============================================================================

-- Classes policies
CREATE POLICY "classes_select_all" ON classes FOR SELECT USING (true);
CREATE POLICY "classes_insert_all" ON classes FOR INSERT WITH CHECK (true);
CREATE POLICY "classes_update_all" ON classes FOR UPDATE USING (true);
CREATE POLICY "classes_delete_all" ON classes FOR DELETE USING (true);

-- Class trainers policies
CREATE POLICY "class_trainers_select_all" ON class_trainers FOR SELECT USING (true);
CREATE POLICY "class_trainers_insert_all" ON class_trainers FOR INSERT WITH CHECK (true);
CREATE POLICY "class_trainers_update_all" ON class_trainers FOR UPDATE USING (true);
CREATE POLICY "class_trainers_delete_all" ON class_trainers FOR DELETE USING (true);

-- ============================================================================
-- STEP 6: CREATE SAMPLE CLASS FOR DATA SCIENCE PROGRAM
-- ============================================================================

-- Insert class for Data Science program (only if it doesn't exist)
INSERT INTO classes (id, program_id, name, description, start_date, end_date, start_time, end_time, max_participants, current_participants, status, location, room, created_at, updated_at)
VALUES (
    '650e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440003',
    'Data Science Fundamentals',
    'Kelas dasar Data Science dan Analytics untuk pengambilan keputusan',
    '2024-04-01',
    '2024-04-30',
    '09:00:00',
    '17:00:00',
    20,
    0,
    'active',
    'Garuda Academy',
    'Room B-201',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    max_participants = EXCLUDED.max_participants,
    status = EXCLUDED.status,
    location = EXCLUDED.location,
    room = EXCLUDED.room,
    updated_at = NOW();

-- ============================================================================
-- STEP 7: VERIFY THE FIX
-- ============================================================================

-- Check if tables exist
SELECT 'Tables Check' as verification_step;
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('classes', 'class_trainers')
GROUP BY table_name;

-- Check classes data
SELECT 'Classes Data' as verification_step;
SELECT 
    p.title as program_title,
    c.name as class_name,
    c.status,
    c.max_participants
FROM classes c
JOIN programs p ON c.program_id = p.id
ORDER BY p.title, c.name;

-- Check programs with their class counts
SELECT 'Programs with Class Counts' as verification_step;
SELECT 
    p.id,
    p.title,
    p.status,
    COUNT(c.id) as class_count
FROM programs p
LEFT JOIN classes c ON p.id = c.program_id
GROUP BY p.id, p.title, p.status
ORDER BY p.title;

-- Check RLS policies
SELECT 'RLS Policies' as verification_step;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('classes', 'class_trainers')
ORDER BY tablename, policyname;

-- ============================================================================
-- FIX COMPLETED!
-- ============================================================================
-- 
-- What was fixed:
-- ✅ Created classes table with correct schema
-- ✅ Created class_trainers table with correct schema
-- ✅ Set up RLS policies for both tables
-- ✅ Created sample class for Data Science program
-- ✅ Added indexes for better performance
-- 
-- You should now be able to:
-- ✅ View classes in the class management page
-- ✅ Add new classes to programs
-- ✅ Edit and delete classes
-- ============================================================================
