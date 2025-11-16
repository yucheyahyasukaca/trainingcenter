-- =====================================================
-- ASSIGN TRAINER "YUCHE YAHYA SUKACA" TO GEMINI CLASS
-- =====================================================
-- Jalankan script ini di Supabase SQL Editor
-- =====================================================

-- 1. Cari trainer "Yuche Yahya Sukaca" di user_profiles
SELECT 
    '1. Trainer di user_profiles' as step,
    id as trainer_user_id,
    full_name,
    email,
    role
FROM user_profiles
WHERE full_name ILIKE '%yuche%yahya%sukaca%'
   OR full_name ILIKE '%yuche%'
   OR email ILIKE '%yuche%'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Cari kelas Gemini untuk Pendidik
SELECT 
    '2. Kelas Gemini' as step,
    c.id as class_id,
    c.name as class_name,
    c.program_id,
    p.title as program_title
FROM classes c
JOIN programs p ON c.program_id = p.id
WHERE (p.title ILIKE '%gemini%' OR p.title ILIKE '%pendidik%')
   OR (c.name ILIKE '%gemini%' OR c.name ILIKE '%pendidik%')
ORDER BY c.created_at DESC;

-- 3. Cek apakah sudah ada assignment
SELECT 
    '3. Assignment yang sudah ada' as step,
    ct.id,
    ct.class_id,
    ct.trainer_id,
    ct.is_primary,
    c.name as class_name,
    up.full_name as trainer_name
FROM class_trainers ct
JOIN classes c ON ct.class_id = c.id
JOIN programs p ON c.program_id = p.id
LEFT JOIN user_profiles up ON ct.trainer_id = up.id
WHERE (p.title ILIKE '%gemini%' OR p.title ILIKE '%pendidik%')
   OR (c.name ILIKE '%gemini%' OR c.name ILIKE '%pendidik%');

-- 4. ASSIGN TRAINER KE KELAS
-- Script ini akan mencari trainer "Yuche Yahya Sukaca" dan assign ke kelas Gemini
-- Ganti class_id dengan ID kelas yang ditemukan di step 2 jika perlu

INSERT INTO class_trainers (class_id, trainer_id, is_primary, role)
SELECT 
    c.id as class_id,
    up.id as trainer_id,
    true as is_primary,
    'instructor' as role
FROM classes c
CROSS JOIN user_profiles up
JOIN programs p ON c.program_id = p.id
WHERE (p.title ILIKE '%gemini%' OR p.title ILIKE '%pendidik%' OR c.name ILIKE '%gemini%')
  AND (up.full_name ILIKE '%yuche%yahya%sukaca%' OR up.full_name ILIKE '%yuche%' OR up.email ILIKE '%yuche%')
  AND up.role IN ('trainer', 'admin', 'manager')
  AND NOT EXISTS (
    SELECT 1 FROM class_trainers ct 
    WHERE ct.class_id = c.id 
    AND ct.trainer_id = up.id
  )
RETURNING 
    id,
    class_id,
    trainer_id,
    is_primary,
    role;

-- 5. VERIFIKASI SETELAH ASSIGN
SELECT 
    '5. Verifikasi setelah assign' as step,
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
WHERE (p.title ILIKE '%gemini%' OR p.title ILIKE '%pendidik%' OR c.name ILIKE '%gemini%')
ORDER BY ct.created_at DESC;

