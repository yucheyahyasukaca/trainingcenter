-- ============================================================================
-- CREATE CLASSES DATA
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script creates classes data for existing programs
-- Run this if programs show "0 kelas tersedia"
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK IF CLASSES TABLE EXISTS
-- ============================================================================

SELECT 'Checking classes table...' as step;

-- Check if classes table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'classes'
) as classes_table_exists;

-- ============================================================================
-- STEP 2: CREATE CLASSES TABLE IF NOT EXISTS
-- ============================================================================

SELECT 'Creating classes table if needed...' as step;

CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    max_participants INTEGER DEFAULT 20,
    current_participants INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    location VARCHAR(255),
    room VARCHAR(100)
);

-- ============================================================================
-- STEP 3: ENABLE RLS ON CLASSES TABLE
-- ============================================================================

SELECT 'Enabling RLS on classes table...' as step;

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY IF NOT EXISTS "classes_select_all" ON classes FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "classes_insert_all" ON classes FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "classes_update_all" ON classes FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "classes_delete_all" ON classes FOR DELETE USING (true);

-- ============================================================================
-- STEP 4: CREATE CLASSES FOR EXISTING PROGRAMS
-- ============================================================================

SELECT 'Creating classes for existing programs...' as step;

-- Insert classes for each published program
INSERT INTO classes (id, program_id, name, description, start_date, end_date, start_time, end_time, max_participants, current_participants, status, location, room, created_at, updated_at)
SELECT 
    gen_random_uuid() as id,
    p.id as program_id,
    'Kelas Pagi - ' || p.title as name,
    'Kelas pagi untuk ' || p.title as description,
    p.start_date as start_date,
    p.end_date as end_date,
    '09:00:00'::time as start_time,
    '12:00:00'::time as end_time,
    15 as max_participants,
    0 as current_participants,
    'scheduled' as status,
    'Garuda Academy' as location,
    'Room A-101' as room,
    NOW() as created_at,
    NOW() as updated_at
FROM programs p
WHERE p.status = 'published'
AND NOT EXISTS (
    SELECT 1 FROM classes c 
    WHERE c.program_id = p.id 
    AND c.name LIKE 'Kelas Pagi%'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO classes (id, program_id, name, description, start_date, end_date, start_time, end_time, max_participants, current_participants, status, location, room, created_at, updated_at)
SELECT 
    gen_random_uuid() as id,
    p.id as program_id,
    'Kelas Sore - ' || p.title as name,
    'Kelas sore untuk ' || p.title as description,
    p.start_date as start_date,
    p.end_date as end_date,
    '13:00:00'::time as start_time,
    '16:00:00'::time as end_time,
    15 as max_participants,
    0 as current_participants,
    'scheduled' as status,
    'Garuda Academy' as location,
    'Room A-102' as room,
    NOW() as created_at,
    NOW() as updated_at
FROM programs p
WHERE p.status = 'published'
AND NOT EXISTS (
    SELECT 1 FROM classes c 
    WHERE c.program_id = p.id 
    AND c.name LIKE 'Kelas Sore%'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 5: VERIFY CLASSES WERE CREATED
-- ============================================================================

SELECT 'Verifying classes were created...' as step;

-- Check classes count per program
SELECT 
    p.id as program_id,
    p.title as program_title,
    COUNT(c.id) as class_count,
    STRING_AGG(c.name, ', ') as class_names
FROM programs p
LEFT JOIN classes c ON p.id = c.program_id
WHERE p.status = 'published'
GROUP BY p.id, p.title
ORDER BY class_count DESC;

-- ============================================================================
-- STEP 6: TEST THE APPLICATION QUERY
-- ============================================================================

SELECT 'Testing application query...' as step;

-- Test the exact query used in the app
SELECT 
    p.id,
    p.title,
    p.description,
    p.category,
    p.price,
    p.start_date,
    p.end_date,
    p.max_participants,
    p.status,
    json_agg(
        json_build_object(
            'id', c.id,
            'name', c.name,
            'description', c.description,
            'start_date', c.start_date,
            'end_date', c.end_date,
            'start_time', c.start_time,
            'end_time', c.end_time,
            'max_participants', c.max_participants,
            'current_participants', c.current_participants,
            'status', c.status,
            'location', c.location,
            'room', c.room
        )
    ) FILTER (WHERE c.id IS NOT NULL) as classes
FROM programs p
LEFT JOIN classes c ON p.id = c.program_id
WHERE p.status = 'published'
GROUP BY p.id, p.title, p.description, p.category, p.price, p.start_date, p.end_date, p.max_participants, p.status
ORDER BY p.created_at DESC;

-- ============================================================================
-- STEP 7: CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================================================

SELECT 'Creating indexes...' as step;

CREATE INDEX IF NOT EXISTS idx_classes_program_id ON classes(program_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_dates ON classes(start_date, end_date);

-- ============================================================================
-- CLASSES DATA CREATED!
-- ============================================================================
-- 
-- Now each program should have 2 classes:
-- - Kelas Pagi (Morning Class)
-- - Kelas Sore (Afternoon Class)
-- 
-- The application should now show the correct number of classes.
-- ============================================================================
