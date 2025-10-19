-- ============================================================================
-- DEBUG CLASS COUNT ISSUE
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script helps debug why Data Science program shows "1 kelas" 
-- but class management shows no classes
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK CURRENT DATA STATE
-- ============================================================================

-- Check all programs and their class counts
SELECT 
    'Programs with Classes' as check_type,
    p.id,
    p.title,
    p.status,
    COUNT(c.id) as class_count
FROM programs p
LEFT JOIN classes c ON p.id = c.program_id
GROUP BY p.id, p.title, p.status
ORDER BY p.title;

-- Check specific Data Science program
SELECT 
    'Data Science Program Details' as check_type,
    p.id,
    p.title,
    p.status,
    COUNT(c.id) as class_count
FROM programs p
LEFT JOIN classes c ON p.id = c.program_id
WHERE p.title LIKE '%Data Science%'
GROUP BY p.id, p.title, p.status;

-- Check all classes
SELECT 
    'All Classes' as check_type,
    c.id,
    c.name,
    c.program_id,
    p.title as program_title,
    c.status
FROM classes c
JOIN programs p ON c.program_id = p.id
ORDER BY p.title, c.name;

-- ============================================================================
-- STEP 2: CHECK FOR ORPHANED CLASSES
-- ============================================================================

-- Check if there are classes without valid programs
SELECT 
    'Orphaned Classes' as check_type,
    c.id,
    c.name,
    c.program_id
FROM classes c
LEFT JOIN programs p ON c.program_id = p.id
WHERE p.id IS NULL;

-- ============================================================================
-- STEP 3: CHECK FOR DATA INCONSISTENCIES
-- ============================================================================

-- Check if there are any classes that might be causing the count issue
SELECT 
    'Potential Issue Classes' as check_type,
    c.id,
    c.name,
    c.program_id,
    p.title as program_title,
    c.status,
    c.created_at
FROM classes c
JOIN programs p ON c.program_id = p.id
WHERE p.title LIKE '%Data Science%'
ORDER BY c.created_at;

-- ============================================================================
-- STEP 4: CREATE MISSING CLASS IF NEEDED
-- ============================================================================

-- Only create class if Data Science program has no classes
INSERT INTO classes (id, program_id, name, description, start_date, end_date, start_time, end_time, max_participants, current_participants, status, location, room, created_at, updated_at)
SELECT 
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
WHERE NOT EXISTS (
    SELECT 1 FROM classes 
    WHERE program_id = '550e8400-e29b-41d4-a716-446655440003'
);

-- ============================================================================
-- STEP 5: VERIFY FIX
-- ============================================================================

-- Final check after potential fix
SELECT 
    'Final Verification' as check_type,
    p.title,
    COUNT(c.id) as class_count
FROM programs p
LEFT JOIN classes c ON p.id = c.program_id
WHERE p.title LIKE '%Data Science%'
GROUP BY p.id, p.title;

-- ============================================================================
-- DEBUG COMPLETED!
-- ============================================================================
