-- =====================================================
-- FIX: ASSIGN TRAINER TO PROGRAM
-- =====================================================
-- Jalankan script ini untuk menambahkan trainer ke program
-- =====================================================

-- Cek dulu trainer yang ada
SELECT 
    'Available Trainers' as info,
    t.id as trainer_id,
    t.user_id,
    up.full_name,
    up.email
FROM public.trainers t
JOIN public.user_profiles up ON t.user_id = up.id
WHERE up.role = 'trainer';

-- Update program "Gemini untuk Pendidik" dengan trainer pertama yang tersedia
UPDATE public.programs 
SET trainer_id = (
    SELECT t.user_id 
    FROM public.trainers t 
    JOIN public.user_profiles up ON t.user_id = up.id 
    WHERE up.role = 'trainer' 
    LIMIT 1
)
WHERE title = 'Gemini untuk Pendidik' AND trainer_id IS NULL;

-- Verifikasi update berhasil
SELECT 
    'Updated Program' as info,
    p.id as program_id,
    p.title,
    p.trainer_id,
    up.full_name as trainer_name,
    up.email as trainer_email
FROM public.programs p
LEFT JOIN public.user_profiles up ON p.trainer_id = up.id
WHERE p.title = 'Gemini untuk Pendidik';
