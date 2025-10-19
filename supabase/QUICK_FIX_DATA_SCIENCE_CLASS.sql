-- ============================================================================
-- QUICK FIX FOR DATA SCIENCE CLASS ISSUE
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script quickly fixes the Data Science program class issue
-- Run this in your Supabase SQL editor
-- ============================================================================

-- Disable RLS temporarily
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;

-- Insert class for Data Science program
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
    current_participants = EXCLUDED.current_participants,
    status = EXCLUDED.status,
    location = EXCLUDED.location,
    room = EXCLUDED.room,
    updated_at = NOW();

-- Re-enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Verify the fix
SELECT 
    p.title as program_title,
    COUNT(c.id) as class_count
FROM programs p
LEFT JOIN classes c ON p.id = c.program_id
WHERE p.title LIKE '%Data Science%'
GROUP BY p.id, p.title;
