-- =====================================================
-- TEST ENROLLMENT QUERY
-- =====================================================
-- Test query yang sama seperti di form pendaftaran
-- =====================================================

-- 1. Test query program dengan classes (seperti di fetchProgram)
WITH gemini_program AS (
    SELECT id FROM programs 
    WHERE title ILIKE '%gemini%' OR title ILIKE '%pendidik%'
    LIMIT 1
)
SELECT 
    'Program with Classes Query' as test,
    p.id,
    p.title,
    p.status,
    p.price,
    COUNT(c.id) as class_count
FROM programs p
LEFT JOIN classes c ON p.id = c.program_id
CROSS JOIN gemini_program gp
WHERE p.id = gp.id
GROUP BY p.id, p.title, p.status, p.price;

-- 2. Test query classes terpisah (seperti fallback)
WITH gemini_program AS (
    SELECT id FROM programs 
    WHERE title ILIKE '%gemini%' OR title ILIKE '%pendidik%'
    LIMIT 1
)
SELECT 
    'Classes Query' as test,
    c.id as class_id,
    c.name as class_name,
    c.status,
    c.max_participants,
    c.current_participants,
    p.title as program_title
FROM classes c
JOIN programs p ON c.program_id = p.id
CROSS JOIN gemini_program gp
WHERE c.program_id = gp.id;

-- 3. Test query dengan class_trainers
WITH gemini_program AS (
    SELECT id FROM programs 
    WHERE title ILIKE '%gemini%' OR title ILIKE '%pendidik%'
    LIMIT 1
)
SELECT 
    'Classes with Trainers Query' as test,
    c.id as class_id,
    c.name as class_name,
    ct.id as class_trainer_id,
    ct.trainer_id,
    ct.role,
    t.name as trainer_name,
    t.email as trainer_email
FROM classes c
JOIN programs p ON c.program_id = p.id
LEFT JOIN class_trainers ct ON c.id = ct.class_id
LEFT JOIN trainers t ON ct.trainer_id = t.id
CROSS JOIN gemini_program gp
WHERE c.program_id = gp.id;

-- 4. Test RLS access
SELECT 
    'RLS Test' as test,
    'classes' as table_name,
    COUNT(*) as accessible_records
FROM classes;

SELECT 
    'RLS Test' as test,
    'class_trainers' as table_name,
    COUNT(*) as accessible_records
FROM class_trainers;
