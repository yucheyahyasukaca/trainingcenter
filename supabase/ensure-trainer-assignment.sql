-- =====================================================
-- ENSURE TRAINER ASSIGNMENT
-- =====================================================
-- Jalankan script ini untuk memastikan trainer ditugaskan dengan benar
-- =====================================================

-- Cek semua trainer yang ada
SELECT 
    'All Trainers' as info,
    t.id as trainer_id,
    t.user_id,
    up.full_name,
    up.email,
    up.role
FROM public.trainers t
JOIN public.user_profiles up ON t.user_id = up.id
ORDER BY t.created_at;

-- Cek semua kelas yang ada
SELECT 
    'All Classes' as info,
    c.id as class_id,
    c.name as class_name,
    p.title as program_title,
    p.id as program_id
FROM public.classes c
JOIN public.programs p ON c.program_id = p.id
ORDER BY c.created_at;

-- Tambahkan trainer pertama ke semua kelas (untuk testing)
INSERT INTO public.class_trainers (class_id, trainer_id, role)
SELECT 
    c.id as class_id,
    t.id as trainer_id,
    'instructor' as role
FROM public.classes c
CROSS JOIN (
    SELECT t.id 
    FROM public.trainers t 
    JOIN public.user_profiles up ON t.user_id = up.id 
    WHERE up.role = 'trainer' 
    LIMIT 1
) t
WHERE NOT EXISTS (
    SELECT 1 FROM public.class_trainers ct 
    WHERE ct.class_id = c.id AND ct.trainer_id = t.id
);

-- Verifikasi assignment
SELECT 
    'Final Class Trainers' as info,
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
ORDER BY ct.created_at;
