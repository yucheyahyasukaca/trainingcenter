-- =====================================================
-- DEBUG GEMINI PROGRAM DATA
-- =====================================================
-- Script untuk mengecek data program "Gemini untuk Pendidik"
-- =====================================================

-- 1. Cari program "Gemini untuk Pendidik"
SELECT 
    'Program Gemini' as info,
    id,
    title,
    description,
    category,
    status,
    price,
    start_date,
    end_date,
    created_at
FROM public.programs 
WHERE title ILIKE '%gemini%' OR title ILIKE '%pendidik%'
ORDER BY created_at DESC;

-- 2. Cari kelas untuk program Gemini
SELECT 
    'Classes for Gemini Program' as info,
    c.id as class_id,
    c.name as class_name,
    c.description,
    c.start_date,
    c.end_date,
    c.status,
    c.max_participants,
    c.current_participants,
    p.title as program_title,
    p.id as program_id
FROM public.classes c
JOIN public.programs p ON c.program_id = p.id
WHERE p.title ILIKE '%gemini%' OR p.title ILIKE '%pendidik%'
ORDER BY c.created_at DESC;

-- 3. Cek class_trainers untuk kelas Gemini
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
FROM public.class_trainers ct
JOIN public.classes c ON ct.class_id = c.id
JOIN public.programs p ON c.program_id = p.id
LEFT JOIN public.trainers t ON ct.trainer_id = t.id
WHERE p.title ILIKE '%gemini%' OR p.title ILIKE '%pendidik%'
ORDER BY ct.created_at DESC;

-- 4. Cek semua trainers yang aktif
SELECT 
    'Active Trainers' as info,
    id,
    name,
    email,
    specialization,
    status,
    created_at
FROM public.trainers 
WHERE status = 'active'
ORDER BY created_at DESC;

-- 5. Cek apakah ada masalah dengan relasi
SELECT 
    'Program-Classes Count' as info,
    p.title as program_title,
    p.id as program_id,
    COUNT(c.id) as class_count
FROM public.programs p
LEFT JOIN public.classes c ON p.id = c.program_id
WHERE p.title ILIKE '%gemini%' OR p.title ILIKE '%pendidik%'
GROUP BY p.id, p.title;
