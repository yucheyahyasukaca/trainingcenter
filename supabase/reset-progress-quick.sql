-- ============================================================================
-- QUICK RESET: Hapus Progress untuk Testing
-- ============================================================================
-- Program ID: 9712d177-5cf4-4ed2-8e66-f871affb0549
-- Module ID: d97d8dd6-ced6-4c67-b076-216f2acf6094
-- ============================================================================

-- STEP 1: Lihat progress yang akan dihapus (lihat dulu sebelum hapus)
-- ============================================================================
SELECT 
    lp.id,
    lp.user_id,
    up.full_name as user_name,
    up.email as user_email,
    lc.title as content_title,
    lp.status,
    lp.completed_at,
    lp.created_at
FROM learning_progress lp
JOIN learning_contents lc ON lc.id = lp.content_id
JOIN enrollments e ON e.id = lp.enrollment_id
LEFT JOIN user_profiles up ON up.id = lp.user_id
WHERE e.program_id = '9712d177-5cf4-4ed2-8e66-f871affb0549'::uuid
ORDER BY lp.created_at DESC;

-- STEP 2: Hapus progress untuk semua user di program ini
-- ============================================================================
-- UNCOMMENT baris di bawah untuk menghapus:
--
-- DELETE FROM learning_progress lp
-- USING enrollments e
-- WHERE lp.enrollment_id = e.id
-- AND e.program_id = '9712d177-5cf4-4ed2-8e66-f871affb0549'::uuid;

-- STEP 3: Hapus progress untuk user tertentu saja
-- ============================================================================
-- UNCOMMENT dan ganti YOUR_USER_ID_HERE dengan user_id Anda:
--
-- DELETE FROM learning_progress lp
-- USING enrollments e
-- WHERE lp.enrollment_id = e.id
-- AND e.program_id = '9712d177-5cf4-4ed2-8e66-f871affb0549'::uuid
-- AND lp.user_id = 'YOUR_USER_ID_HERE'::uuid;

-- STEP 4: Verifikasi (setelah hapus, hasil harus 0)
-- ============================================================================
SELECT COUNT(*) as remaining_progress
FROM learning_progress lp
JOIN enrollments e ON e.id = lp.enrollment_id
WHERE e.program_id = '9712d177-5cf4-4ed2-8e66-f871affb0549'::uuid;
