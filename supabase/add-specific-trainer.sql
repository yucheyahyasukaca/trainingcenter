-- =====================================================
-- ADD SPECIFIC TRAINER TO TRAINERS TABLE
-- =====================================================
-- Jalankan script ini untuk menambahkan trainer spesifik
-- =====================================================

-- Cek apakah trainer sudah ada
SELECT 
    'Checking existing trainers' as info,
    t.id as trainer_id,
    t.user_id,
    up.full_name,
    up.email
FROM public.trainers t
JOIN public.user_profiles up ON t.user_id = up.id
WHERE up.email = 'trainer@garuda-21.com';

-- Tambahkan trainer jika belum ada
INSERT INTO public.trainers (user_id, created_at, updated_at)
SELECT 
    up.id as user_id,
    NOW() as created_at,
    NOW() as updated_at
FROM public.user_profiles up
WHERE up.email = 'trainer@garuda-21.com'
AND up.role = 'trainer'
AND up.id NOT IN (SELECT user_id FROM public.trainers);

-- Verifikasi trainer berhasil ditambahkan
SELECT 
    'Final trainers list' as info,
    t.id as trainer_id,
    t.user_id,
    up.full_name,
    up.email,
    up.role
FROM public.trainers t
JOIN public.user_profiles up ON t.user_id = up.id
WHERE up.email = 'trainer@garuda-21.com';
