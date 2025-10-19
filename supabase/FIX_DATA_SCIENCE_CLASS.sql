-- ============================================================================
-- FIX DATA SCIENCE PROGRAM CLASS ISSUE
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script fixes the issue where Data Science program shows "1 kelas" 
-- but class management shows no classes
-- ============================================================================

-- ============================================================================
-- STEP 1: DISABLE RLS TEMPORARILY
-- ============================================================================

ALTER TABLE classes DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: CREATE CLASS FOR DATA SCIENCE PROGRAM
-- ============================================================================

-- Create a class for Data Science program
INSERT INTO classes (id, program_id, name, description, start_date, end_date, start_time, end_time, max_participants, current_participants, status, location, room, created_at, updated_at)
VALUES (
    '650e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440003',
    'Data Science Fundamentals',
    'Kelas dasar Data Science dan Analytics',
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
    current_participants = EXCLUDED.current_participants,
    status = EXCLUDED.status,
    location = EXCLUDED.location,
    room = EXCLUDED.room,
    updated_at = NOW();

-- ============================================================================
-- STEP 3: ENABLE RLS
-- ============================================================================

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: VERIFY FIX
-- ============================================================================

-- Check classes for Data Science program
SELECT 
    p.title as program_title,
    COUNT(c.id) as class_count
FROM programs p
LEFT JOIN classes c ON p.id = c.program_id
WHERE p.id = '550e8400-e29b-41d4-a716-446655440003'
GROUP BY p.id, p.title;

-- Check all programs and their class counts
SELECT 
    p.title as program_title,
    p.status,
    COUNT(c.id) as class_count
FROM programs p
LEFT JOIN classes c ON p.id = c.program_id
GROUP BY p.id, p.title, p.status
ORDER BY p.title;

-- ============================================================================
-- FIX COMPLETED!
-- ============================================================================
-- 
-- The Data Science program now has 1 class, which should match 
-- the "1 kelas" display in the program card.
-- ============================================================================
