-- =====================================================
-- ASSIGN TRAINER TO CLASS
-- =====================================================
-- Jalankan script ini untuk menambahkan trainer ke kelas
-- =====================================================

-- Cek dulu data yang ada
SELECT 
    'Available Trainers' as info,
    t.id as trainer_id,
    t.user_id,
    up.full_name,
    up.email
FROM public.trainers t
JOIN public.user_profiles up ON t.user_id = up.id
WHERE up.role = 'trainer';

-- Cek kelas yang ada
SELECT 
    'Available Classes' as info,
    c.id as class_id,
    c.name as class_name,
    p.title as program_title,
    p.id as program_id
FROM public.classes c
JOIN public.programs p ON c.program_id = p.id
ORDER BY c.created_at;

-- Cek class_trainers yang sudah ada
SELECT 
    'Existing Class Trainers' as info,
    ct.id,
    ct.class_id,
    ct.trainer_id,
    c.name as class_name,
    p.title as program_title,
    up.full_name as trainer_name
FROM public.class_trainers ct
JOIN public.classes c ON ct.class_id = c.id
JOIN public.programs p ON c.program_id = p.id
JOIN public.trainers t ON ct.trainer_id = t.id
JOIN public.user_profiles up ON t.user_id = up.id
ORDER BY ct.created_at;
