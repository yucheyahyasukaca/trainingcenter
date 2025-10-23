-- =====================================================
-- CREATE CLASS FOR GEMINI PROGRAM
-- =====================================================

-- 1. First, find the Gemini program ID
WITH gemini_program AS (
    SELECT id, title 
    FROM programs 
    WHERE title ILIKE '%gemini%' OR title ILIKE '%pendidik%'
    LIMIT 1
)

-- 2. Create a class for Gemini program if it doesn't exist
INSERT INTO classes (
    id,
    program_id,
    name,
    description,
    start_date,
    end_date,
    start_time,
    end_time,
    max_participants,
    current_participants,
    status,
    location,
    room,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid() as id,
    gp.id as program_id,
    'Kelas Gemini untuk Pendidik' as name,
    'Kelas pembelajaran Gemini untuk pendidik dan tenaga kependidikan' as description,
    CURRENT_DATE as start_date,
    CURRENT_DATE + INTERVAL '30 days' as end_date,
    '09:00:00'::time as start_time,
    '17:00:00'::time as end_time,
    50 as max_participants,
    0 as current_participants,
    'scheduled' as status,
    'Garuda Academy' as location,
    'Room A-101' as room,
    NOW() as created_at,
    NOW() as updated_at
FROM gemini_program gp
WHERE NOT EXISTS (
    SELECT 1 FROM classes c 
    WHERE c.program_id = gp.id 
    AND c.name ILIKE '%gemini%'
)
RETURNING id, program_id, name;

-- 3. Verify the class was created
SELECT 
    'Verification' as info,
    c.id as class_id,
    c.name as class_name,
    c.status,
    p.title as program_title
FROM classes c
JOIN programs p ON c.program_id = p.id
WHERE p.title ILIKE '%gemini%' OR p.title ILIKE '%pendidik%'
ORDER BY c.created_at DESC;
