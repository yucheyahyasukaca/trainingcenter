-- =====================================================
-- COMPLETE FIX FOR GEMINI PROGRAM
-- =====================================================
-- Script lengkap untuk memperbaiki program Gemini
-- =====================================================

-- Step 1: Fix RLS policies
DROP POLICY IF EXISTS "classes_select_all" ON classes;
DROP POLICY IF EXISTS "classes_insert_all" ON classes;
DROP POLICY IF EXISTS "classes_update_all" ON classes;
DROP POLICY IF EXISTS "classes_delete_all" ON classes;

DROP POLICY IF EXISTS "Everyone can view classes of published programs" ON classes;
DROP POLICY IF EXISTS "Admins and managers can manage classes" ON classes;

CREATE POLICY "classes_select_everyone" ON classes FOR SELECT USING (true);
CREATE POLICY "classes_insert_everyone" ON classes FOR INSERT WITH CHECK (true);
CREATE POLICY "classes_update_everyone" ON classes FOR UPDATE USING (true);
CREATE POLICY "classes_delete_everyone" ON classes FOR DELETE USING (true);

-- Step 2: Fix class_trainers policies
DROP POLICY IF EXISTS "class_trainers_select_all" ON class_trainers;
DROP POLICY IF EXISTS "class_trainers_insert_all" ON class_trainers;
DROP POLICY IF EXISTS "class_trainers_update_all" ON class_trainers;
DROP POLICY IF EXISTS "class_trainers_delete_all" ON class_trainers;

DROP POLICY IF EXISTS "Everyone can view class trainers" ON class_trainers;
DROP POLICY IF EXISTS "Admins and managers can manage class trainers" ON class_trainers;

CREATE POLICY "class_trainers_select_everyone" ON class_trainers FOR SELECT USING (true);
CREATE POLICY "class_trainers_insert_everyone" ON class_trainers FOR INSERT WITH CHECK (true);
CREATE POLICY "class_trainers_update_everyone" ON class_trainers FOR UPDATE USING (true);
CREATE POLICY "class_trainers_delete_everyone" ON class_trainers FOR DELETE USING (true);

-- Step 3: Create class for Gemini program
WITH gemini_program AS (
    SELECT id, title 
    FROM programs 
    WHERE title ILIKE '%gemini%' OR title ILIKE '%pendidik%'
    LIMIT 1
)
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
);

-- Step 4: Assign trainer to Gemini class
WITH gemini_class AS (
    SELECT c.id as class_id, c.name as class_name, p.title as program_title
    FROM classes c
    JOIN programs p ON c.program_id = p.id
    WHERE p.title ILIKE '%gemini%' OR p.title ILIKE '%pendidik%'
    ORDER BY c.created_at DESC
    LIMIT 1
),
active_trainer AS (
    SELECT id, name, email
    FROM trainers 
    WHERE status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
)
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
);

-- Step 5: Verify everything is working
SELECT 'Final Verification' as step;

-- Check Gemini program
SELECT 
    'Gemini Program' as info,
    id,
    title,
    status,
    price
FROM programs 
WHERE title ILIKE '%gemini%' OR title ILIKE '%pendidik%';

-- Check Gemini classes
SELECT 
    'Gemini Classes' as info,
    c.id as class_id,
    c.name as class_name,
    c.status,
    c.max_participants,
    c.current_participants,
    p.title as program_title
FROM classes c
JOIN programs p ON c.program_id = p.id
WHERE p.title ILIKE '%gemini%' OR p.title ILIKE '%pendidik%';

-- Check class trainers
SELECT 
    'Gemini Class Trainers' as info,
    ct.id as class_trainer_id,
    ct.role,
    ct.is_primary,
    c.name as class_name,
    t.name as trainer_name,
    t.email as trainer_email
FROM class_trainers ct
JOIN classes c ON ct.class_id = c.id
JOIN programs p ON c.program_id = p.id
JOIN trainers t ON ct.trainer_id = t.id
WHERE p.title ILIKE '%gemini%' OR p.title ILIKE '%pendidik%';
