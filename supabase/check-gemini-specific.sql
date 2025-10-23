-- =====================================================
-- CHECK GEMINI PROGRAM SPECIFICALLY
-- =====================================================

-- 1. Find Gemini program
SELECT 
    'Gemini Program' as info,
    id,
    title,
    description,
    status,
    price,
    start_date,
    end_date,
    created_at
FROM programs 
WHERE title ILIKE '%gemini%' OR title ILIKE '%pendidik%'
ORDER BY created_at DESC;

-- 2. Check if there are any classes for Gemini program
SELECT 
    'Classes for Gemini' as info,
    c.id as class_id,
    c.name as class_name,
    c.description,
    c.status as class_status,
    c.start_date,
    c.end_date,
    c.max_participants,
    c.current_participants,
    p.title as program_title,
    p.id as program_id
FROM classes c
JOIN programs p ON c.program_id = p.id
WHERE p.title ILIKE '%gemini%' OR p.title ILIKE '%pendidik%'
ORDER BY c.created_at DESC;

-- 3. Check class_trainers for Gemini classes
SELECT 
    'Class Trainers for Gemini' as info,
    ct.id as class_trainer_id,
    ct.class_id,
    ct.trainer_id,
    ct.role,
    ct.is_primary,
    c.name as class_name,
    p.title as program_title,
    t.name as trainer_name,
    t.email as trainer_email
FROM class_trainers ct
JOIN classes c ON ct.class_id = c.id
JOIN programs p ON c.program_id = p.id
LEFT JOIN trainers t ON ct.trainer_id = t.id
WHERE p.title ILIKE '%gemini%' OR p.title ILIKE '%pendidik%'
ORDER BY ct.created_at DESC;

-- 4. Check all programs and their class counts
SELECT 
    'All Programs Class Count' as info,
    p.id as program_id,
    p.title as program_title,
    p.status as program_status,
    COUNT(c.id) as class_count
FROM programs p
LEFT JOIN classes c ON p.id = c.program_id
GROUP BY p.id, p.title, p.status
ORDER BY p.created_at DESC;
