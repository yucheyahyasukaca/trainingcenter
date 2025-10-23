-- =====================================================
-- CHECK CLASS TRAINERS DATA
-- =====================================================
-- Jalankan script ini untuk mengecek data class_trainers
-- =====================================================

-- Cek data class_trainers untuk kelas yang spesifik
SELECT 
    'Class Trainers Data' as info,
    ct.id,
    ct.class_id,
    ct.trainer_id,
    ct.role,
    c.name as class_name,
    p.title as program_title,
    p.id as program_id
FROM public.class_trainers ct
JOIN public.classes c ON ct.class_id = c.id
JOIN public.programs p ON c.program_id = p.id
WHERE c.id = 'd97d8dd6-ced6-4c67-b076-216f2acf6094'  -- Ganti dengan class_id yang benar
ORDER BY ct.created_at;

-- Cek semua class_trainers
SELECT 
    'All Class Trainers' as info,
    ct.id,
    ct.class_id,
    ct.trainer_id,
    ct.role,
    c.name as class_name,
    p.title as program_title
FROM public.class_trainers ct
JOIN public.classes c ON ct.class_id = c.id
JOIN public.programs p ON c.program_id = p.id
ORDER BY ct.created_at;
