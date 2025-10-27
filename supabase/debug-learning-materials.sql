-- =====================================================
-- DEBUG: Mengapa materi pembelajaran tidak muncul semua?
-- =====================================================
-- Jalankan query ini di Supabase SQL Editor untuk debug
-- =====================================================

-- 1. Cek apakah materi ada di database
-- =====================================================
SELECT 
    lc.id,
    lc.title,
    lc.status,
    lc.is_free,
    lc.class_id,
    c.name as class_name
FROM learning_contents lc
LEFT JOIN classes c ON lc.class_id = c.id
WHERE lc.status = 'published'
ORDER BY lc.order_index;

-- 2. Cek enrollment untuk user yang sedang login
-- =====================================================
-- Ganti 'YOUR_USER_ID_HERE' dengan user ID yang login
SELECT 
    e.id as enrollment_id,
    e.status as enrollment_status,
    e.participant_id,
    p.id as participant_id_from_participants,
    p.user_id,
    p.name as participant_name,
    c.id as class_id,
    c.name as class_name
FROM enrollments e
JOIN participants p ON e.participant_id = p.id
JOIN classes c ON e.class_id = c.id
WHERE p.user_id::text = 'GANTI_DENGAN_USER_ID_DISINI';  -- Ganti ini dengan user_id

-- 3. Cek RLS policy saat ini
-- =====================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'learning_contents'
ORDER BY policyname;

-- 4. Test query learning_contents untuk user
-- =====================================================
-- Jalankan ini saat login sebagai user yang bermasalah
SELECT 
    lc.id,
    lc.title,
    lc.status,
    lc.is_free,
    lc.class_id,
    c.name as class_name
FROM learning_contents lc
LEFT JOIN classes c ON lc.class_id = c.id
WHERE lc.status = 'published'
ORDER BY lc.order_index;

-- Catatan: 
-- - Query 4 harus dijalankan saat sudah login (akan menggunakan auth.uid())
-- - Jika hasil query 4 hanya 2 baris, berarti RLS policy masih bermasalah
-- - Jika hasil query 1 dan 4 berbeda, berarti ada masalah di RLS policy

