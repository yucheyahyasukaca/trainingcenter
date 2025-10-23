-- =====================================================
-- ADD USER TO TRAINERS TABLE
-- =====================================================
-- Jalankan script ini untuk menambahkan user ke tabel trainers
-- =====================================================

-- Cek user yang ada dengan role trainer
SELECT 
    'Users with trainer role' as info,
    up.id as user_id,
    up.email,
    up.full_name,
    up.role,
    t.id as trainer_id
FROM public.user_profiles up
LEFT JOIN public.trainers t ON up.id = t.user_id
WHERE up.role = 'trainer'
ORDER BY up.created_at;

-- Tambahkan user ke tabel trainers jika belum ada
INSERT INTO public.trainers (user_id, created_at, updated_at)
SELECT 
    up.id as user_id,
    NOW() as created_at,
    NOW() as updated_at
FROM public.user_profiles up
WHERE up.role = 'trainer'
AND up.id NOT IN (SELECT user_id FROM public.trainers);

-- Verifikasi trainer berhasil ditambahkan
SELECT 
    'Updated Trainers' as info,
    t.id as trainer_id,
    t.user_id,
    up.full_name,
    up.email,
    up.role
FROM public.trainers t
JOIN public.user_profiles up ON t.user_id = up.id
WHERE up.role = 'trainer'
ORDER BY t.created_at;
