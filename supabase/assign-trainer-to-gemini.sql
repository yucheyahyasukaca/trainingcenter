-- =====================================================
-- ASSIGN TRAINER TO GEMINI CLASS
-- =====================================================

-- 1. Find the Gemini class
WITH gemini_class AS (
    SELECT c.id as class_id, c.name as class_name, p.title as program_title
    FROM classes c
    JOIN programs p ON c.program_id = p.id
    WHERE p.title ILIKE '%gemini%' OR p.title ILIKE '%pendidik%'
    ORDER BY c.created_at DESC
    LIMIT 1
)

-- 2. Find an active trainer
, active_trainer AS (
    SELECT id, name, email
    FROM trainers 
    WHERE status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
)

-- 3. Assign trainer to Gemini class
INSERT INTO class_trainers (
    id,
    class_id,
    trainer_id,
    role,
    is_primary,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid() as id,
    gc.class_id,
    at.id as trainer_id,
    'primary' as role,
    true as is_primary,
    NOW() as created_at,
    NOW() as updated_at
FROM gemini_class gc
CROSS JOIN active_trainer at
WHERE NOT EXISTS (
    SELECT 1 FROM class_trainers ct 
    WHERE ct.class_id = gc.class_id 
    AND ct.trainer_id = at.id
)
RETURNING id, class_id, trainer_id, role;

-- 4. Verify the assignment
SELECT 
    'Verification' as info,
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
JOIN trainers t ON ct.trainer_id = t.id
WHERE p.title ILIKE '%gemini%' OR p.title ILIKE '%pendidik%'
ORDER BY ct.created_at DESC;
