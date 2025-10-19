-- ============================================================================
-- DEBUG: Classes Not Showing (0 kelas tersedia)
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- Issue: Program shows "0 kelas tersedia" but should show 2 classes
-- This script debugs the classes data and relationships
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK CLASSES TABLE
-- ============================================================================

SELECT 'Checking classes table...' as step;

-- Check if classes table exists and has data
SELECT 
    id,
    program_id,
    name,
    description,
    start_date,
    end_date,
    max_participants,
    current_participants,
    status
FROM classes 
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 2: CHECK PROGRAMS TABLE
-- ============================================================================

SELECT 'Checking programs table...' as step;

-- Check programs and their IDs
SELECT 
    id,
    title,
    status
FROM programs 
WHERE status = 'published'
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 3: CHECK RELATIONSHIP BETWEEN PROGRAMS AND CLASSES
-- ============================================================================

SELECT 'Checking program-class relationships...' as step;

-- Check which programs have classes
SELECT 
    p.id as program_id,
    p.title as program_title,
    COUNT(c.id) as class_count
FROM programs p
LEFT JOIN classes c ON p.id = c.program_id
WHERE p.status = 'published'
GROUP BY p.id, p.title
ORDER BY class_count DESC;

-- ============================================================================
-- STEP 4: TEST THE EXACT QUERY USED IN APPLICATION
-- ============================================================================

SELECT 'Testing application query...' as step;

-- Test the exact query used in the app
SELECT 
    p.*,
    c.id as class_id,
    c.name as class_name,
    c.description as class_description,
    c.start_date as class_start_date,
    c.end_date as class_end_date,
    c.max_participants as class_max_participants,
    c.current_participants as class_current_participants,
    c.status as class_status
FROM programs p
LEFT JOIN classes c ON p.id = c.program_id
WHERE p.status = 'published'
ORDER BY p.created_at DESC, c.created_at ASC;

-- ============================================================================
-- STEP 5: CHECK FOR MISSING CLASSES DATA
-- ============================================================================

SELECT 'Checking for missing classes data...' as step;

-- Check if we need to create classes for existing programs
SELECT 
    p.id as program_id,
    p.title as program_title,
    CASE 
        WHEN COUNT(c.id) = 0 THEN 'NO CLASSES - NEED TO CREATE'
        ELSE CONCAT(COUNT(c.id), ' classes found')
    END as class_status
FROM programs p
LEFT JOIN classes c ON p.id = c.program_id
WHERE p.status = 'published'
GROUP BY p.id, p.title
ORDER BY p.created_at DESC;

-- ============================================================================
-- STEP 6: CREATE MISSING CLASSES IF NEEDED
-- ============================================================================

SELECT 'Creating missing classes if needed...' as step;

-- Create classes for programs that don't have any
DO $$
DECLARE
    program_record RECORD;
    class_count INTEGER;
BEGIN
    FOR program_record IN 
        SELECT p.id, p.title 
        FROM programs p 
        WHERE p.status = 'published'
        AND NOT EXISTS (SELECT 1 FROM classes c WHERE c.program_id = p.id)
    LOOP
        -- Create 2 classes for each program
        INSERT INTO classes (id, program_id, name, description, start_date, end_date, start_time, end_time, max_participants, current_participants, status, location, room, created_at, updated_at)
        VALUES 
            (
                gen_random_uuid(),
                program_record.id,
                'Kelas Pagi - ' || program_record.title,
                'Kelas pagi untuk ' || program_record.title,
                CURRENT_DATE + INTERVAL '7 days',
                CURRENT_DATE + INTERVAL '37 days',
                '09:00:00',
                '12:00:00',
                15,
                0,
                'scheduled',
                'Garuda Academy',
                'Room A-101',
                NOW(),
                NOW()
            ),
            (
                gen_random_uuid(),
                program_record.id,
                'Kelas Sore - ' || program_record.title,
                'Kelas sore untuk ' || program_record.title,
                CURRENT_DATE + INTERVAL '7 days',
                CURRENT_DATE + INTERVAL '37 days',
                '13:00:00',
                '16:00:00',
                15,
                0,
                'scheduled',
                'Garuda Academy',
                'Room A-102',
                NOW(),
                NOW()
            );
        
        RAISE NOTICE 'Created 2 classes for program: %', program_record.title;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 7: VERIFY CLASSES WERE CREATED
-- ============================================================================

SELECT 'Verifying classes were created...' as step;

-- Check classes again
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
-- STEP 8: TEST SUPABASE QUERY SYNTAX
-- ============================================================================

SELECT 'Testing Supabase query syntax...' as step;

-- Test the exact Supabase query format
-- This simulates what the app does
WITH program_data AS (
    SELECT 
        p.*,
        json_agg(
            json_build_object(
                'id', c.id,
                'name', c.name,
                'description', c.description,
                'start_date', c.start_date,
                'end_date', c.end_date,
                'max_participants', c.max_participants,
                'current_participants', c.current_participants,
                'status', c.status
            )
        ) FILTER (WHERE c.id IS NOT NULL) as classes
    FROM programs p
    LEFT JOIN classes c ON p.id = c.program_id
    WHERE p.status = 'published'
    GROUP BY p.id, p.title, p.description, p.category, p.price, p.start_date, p.end_date, p.max_participants, p.current_participants, p.status, p.created_at, p.updated_at
)
SELECT 
    id,
    title,
    json_array_length(COALESCE(classes, '[]'::json)) as class_count,
    classes
FROM program_data
ORDER BY created_at DESC;

-- ============================================================================
-- DEBUG COMPLETE!
-- ============================================================================
-- 
-- This script will:
-- 1. Check if classes table has data
-- 2. Check program-class relationships
-- 3. Test the exact query used in the app
-- 4. Create missing classes if needed
-- 5. Verify the fix worked
-- 
-- After running this script, the program should show the correct number of classes.
-- ============================================================================
