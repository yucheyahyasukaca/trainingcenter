-- =====================================================
-- FIX TRAINER ASSIGNMENT TO CLASS
-- =====================================================
-- Script untuk memastikan trainer "Yuche Yahya Sukaca" 
-- ditugaskan ke kelas yang benar
-- =====================================================

-- 1. Cari trainer "Yuche Yahya Sukaca" di user_profiles
SELECT 
    'Trainer di user_profiles' as info,
    id,
    full_name,
    email,
    role
FROM user_profiles
WHERE full_name ILIKE '%Yuche%' 
   OR full_name ILIKE '%Yahya%'
   OR full_name ILIKE '%Sukaca%'
   OR email ILIKE '%yuche%';

-- 2. Cari trainer di tabel trainers (jika ada)
SELECT 
    'Trainer di trainers table' as info,
    t.id,
    t.name,
    t.email,
    t.user_id,
    up.full_name as user_profile_name
FROM trainers t
LEFT JOIN user_profiles up ON t.user_id = up.id
WHERE t.name ILIKE '%Yuche%' 
   OR t.name ILIKE '%Yahya%'
   OR t.name ILIKE '%Sukaca%'
   OR t.email ILIKE '%yuche%';

-- 3. Cari kelas untuk program Gemini
SELECT 
    'Kelas untuk program Gemini' as info,
    c.id as class_id,
    c.name as class_name,
    c.program_id,
    p.title as program_title
FROM classes c
JOIN programs p ON c.program_id = p.id
WHERE p.title ILIKE '%gemini%' 
   OR p.title ILIKE '%pendidik%'
   OR c.name ILIKE '%gemini%'
ORDER BY c.created_at DESC;

-- 4. Cek assignment trainer yang sudah ada
SELECT 
    'Assignment yang sudah ada' as info,
    ct.id,
    ct.class_id,
    ct.trainer_id,
    ct.is_primary,
    c.name as class_name,
    p.title as program_title,
    up.full_name as trainer_name,
    up.email as trainer_email
FROM class_trainers ct
JOIN classes c ON ct.class_id = c.id
JOIN programs p ON c.program_id = p.id
LEFT JOIN user_profiles up ON ct.trainer_id = up.id
WHERE p.title ILIKE '%gemini%' 
   OR p.title ILIKE '%pendidik%'
   OR c.name ILIKE '%gemini%'
ORDER BY ct.created_at DESC;

-- 5. Assign trainer ke kelas (jika belum ada)
-- Ganti class_id dan trainer_id dengan ID yang ditemukan dari query di atas
-- Uncomment dan jalankan bagian ini setelah menemukan ID yang benar

/*
-- Contoh: Assign trainer dari user_profiles ke kelas
INSERT INTO class_trainers (class_id, trainer_id, is_primary, role)
SELECT 
    c.id as class_id,
    up.id as trainer_id,
    true as is_primary,
    'instructor' as role
FROM classes c
CROSS JOIN user_profiles up
WHERE c.name ILIKE '%gemini%'
  AND up.full_name ILIKE '%Yuche%Yahya%Sukaca%'
  AND NOT EXISTS (
    SELECT 1 FROM class_trainers ct 
    WHERE ct.class_id = c.id 
    AND ct.trainer_id = up.id
  )
RETURNING *;
*/

-- 6. Verifikasi assignment setelah insert
SELECT 
    'Verifikasi setelah insert' as info,
    ct.id,
    ct.class_id,
    ct.trainer_id,
    ct.is_primary,
    c.name as class_name,
    p.title as program_title,
    up.full_name as trainer_name,
    up.email as trainer_email
FROM class_trainers ct
JOIN classes c ON ct.class_id = c.id
JOIN programs p ON c.program_id = p.id
LEFT JOIN user_profiles up ON ct.trainer_id = up.id
WHERE p.title ILIKE '%gemini%' 
   OR p.title ILIKE '%pendidik%'
   OR c.name ILIKE '%gemini%'
ORDER BY ct.created_at DESC;

