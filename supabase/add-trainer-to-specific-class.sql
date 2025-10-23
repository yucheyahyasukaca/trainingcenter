-- =====================================================
-- ADD TRAINER TO SPECIFIC CLASS
-- =====================================================
-- Jalankan script ini untuk menambahkan trainer ke kelas tertentu
-- =====================================================

-- Cek trainer yang ada
SELECT 
    'Available Trainers' as info,
    t.id as trainer_id,
    t.user_id,
    up.full_name,
    up.email
FROM public.trainers t
JOIN public.user_profiles up ON t.user_id = up.id
WHERE up.role = 'trainer';

-- Cek kelas yang ada untuk program "Gemini untuk Pendidik"
SELECT 
    'Classes for Gemini Program' as info,
    c.id as class_id,
    c.name as class_name,
    p.title as program_title,
    p.id as program_id
FROM public.classes c
JOIN public.programs p ON c.program_id = p.id
WHERE p.title = 'Gemini untuk Pendidik'
ORDER BY c.created_at;

-- Tambahkan trainer pertama ke kelas pertama dari program "Gemini untuk Pendidik"
INSERT INTO public.class_trainers (class_id, trainer_id, role)
SELECT 
    c.id as class_id,
    t.id as trainer_id,
    'instructor' as role
FROM public.classes c
JOIN public.programs p ON c.program_id = p.id
CROSS JOIN (
    SELECT t.id 
    FROM public.trainers t 
    JOIN public.user_profiles up ON t.user_id = up.id 
    WHERE up.role = 'trainer' 
    LIMIT 1
) t
WHERE p.title = 'Gemini untuk Pendidik'
AND c.id NOT IN (
    SELECT ct.class_id 
    FROM public.class_trainers ct 
    WHERE ct.class_id = c.id
)
LIMIT 1;

-- Verifikasi trainer berhasil ditambahkan
SELECT 
    'Updated Class Trainers' as info,
    ct.id,
    ct.class_id,
    ct.trainer_id,
    ct.role,
    c.name as class_name,
    p.title as program_title,
    up.full_name as trainer_name
FROM public.class_trainers ct
JOIN public.classes c ON ct.class_id = c.id
JOIN public.programs p ON c.program_id = p.id
JOIN public.trainers t ON ct.trainer_id = t.id
JOIN public.user_profiles up ON t.user_id = up.id
WHERE p.title = 'Gemini untuk Pendidik'
ORDER BY ct.created_at;
