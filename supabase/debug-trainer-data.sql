-- =====================================================
-- DEBUG: CHECK SPECIFIC TRAINER DATA
-- =====================================================
-- Jalankan script ini untuk debug data trainer spesifik
-- =====================================================

-- Cek semua user dengan role trainer
SELECT 
    'Users with trainer role' as info,
    up.id as user_id,
    up.full_name,
    up.email,
    up.role,
    t.id as trainer_id
FROM public.user_profiles up
LEFT JOIN public.trainers t ON up.id = t.user_id
WHERE up.role = 'trainer'
ORDER BY up.created_at;

-- Cek programs dan trainer_id mereka
SELECT 
    'Programs and their trainers' as info,
    p.id as program_id,
    p.title,
    p.trainer_id,
    up.full_name as trainer_name,
    up.email as trainer_email
FROM public.programs p
LEFT JOIN public.user_profiles up ON p.trainer_id = up.id
ORDER BY p.created_at;

-- Cek class_trainers assignments
SELECT 
    'Class trainer assignments' as info,
    ct.id,
    ct.class_id,
    ct.trainer_id,
    c.name as class_name,
    p.title as program_title,
    p.trainer_id as program_trainer_id,
    t.user_id as trainer_user_id,
    up.full_name as trainer_name
FROM public.class_trainers ct
JOIN public.classes c ON ct.class_id = c.id
JOIN public.programs p ON c.program_id = p.id
JOIN public.trainers t ON ct.trainer_id = t.id
LEFT JOIN public.user_profiles up ON t.user_id = up.id
ORDER BY ct.created_at;
