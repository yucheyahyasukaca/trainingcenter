-- =====================================================
-- DEBUG: CHECK TRAINER ACCESS DATA
-- =====================================================
-- Jalankan script ini untuk debug masalah akses trainer
-- =====================================================

-- Cek data trainers
SELECT 
    'Trainers Data' as info,
    t.id as trainer_id,
    t.user_id,
    up.full_name,
    up.role,
    up.email
FROM public.trainers t
JOIN public.user_profiles up ON t.user_id = up.id
ORDER BY t.created_at;

-- Cek data programs dengan trainer_id
SELECT 
    'Programs with Trainer' as info,
    p.id as program_id,
    p.title,
    p.trainer_id,
    up.full_name as trainer_name
FROM public.programs p
LEFT JOIN public.user_profiles up ON p.trainer_id = up.id
ORDER BY p.created_at;

-- Cek data class_trainers
SELECT 
    'Class Trainers' as info,
    ct.id,
    ct.class_id,
    ct.trainer_id,
    c.name as class_name,
    p.title as program_title,
    t.user_id,
    up.full_name as trainer_name
FROM public.class_trainers ct
JOIN public.classes c ON ct.class_id = c.id
JOIN public.programs p ON c.program_id = p.id
JOIN public.trainers t ON ct.trainer_id = t.id
JOIN public.user_profiles up ON t.user_id = up.id
ORDER BY ct.created_at;

-- Cek learning_contents
SELECT 
    'Learning Contents' as info,
    lc.id,
    lc.title,
    lc.class_id,
    c.name as class_name,
    p.title as program_title,
    p.trainer_id as program_trainer_id
FROM public.learning_contents lc
JOIN public.classes c ON lc.class_id = c.id
JOIN public.programs p ON c.program_id = p.id
ORDER BY lc.created_at;
