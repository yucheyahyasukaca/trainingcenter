-- ============================================================================
-- DIRECT FIX: Update enrollment berdasarkan Program ID yang terlihat di console
-- Program ID: 9712d177-5cf4-4ed2-8e66-f871affb0549 (Gemini untuk Pendidik)
-- ============================================================================

-- 1. CEK: Lihat enrollment spesifik untuk program ini
SELECT 
    e.id as enrollment_id,
    e.status,
    e.payment_status,
    e.certificate_issued,
    e.created_at,
    e.updated_at,
    pa.email,
    pa.name,
    p.title
FROM enrollments e
JOIN participants pa ON pa.id = e.participant_id
JOIN programs p ON p.id = e.program_id
WHERE p.id = '9712d177-5cf4-4ed2-8e66-f871affb0549'
  AND pa.email = 'yucheyahya@gmail.com';

-- 2. UPDATE LANGSUNG: Set status ke 'approved' untuk enrollment ini
UPDATE enrollments
SET 
    status = 'approved',
    payment_status = 'paid',
    updated_at = NOW()
WHERE program_id = '9712d177-5cf4-4ed2-8e66-f871affb0549'
  AND participant_id IN (
    SELECT pa.id 
    FROM participants pa
    JOIN user_profiles up ON up.id = pa.user_id
    WHERE up.email = 'yucheyahya@gmail.com'
  );

-- 3. VERIFY: Cek lagi setelah update
SELECT 
    e.id as enrollment_id,
    e.status as NEW_STATUS,
    e.payment_status,
    e.certificate_issued,
    e.updated_at,
    pa.email,
    p.title
FROM enrollments e
JOIN participants pa ON pa.id = e.participant_id
JOIN programs p ON p.id = e.program_id
WHERE p.id = '9712d177-5cf4-4ed2-8e66-f871affb0549'
  AND pa.email = 'yucheyahya@gmail.com';

-- 4. Lihat SEMUA enrollment untuk user ini
SELECT 
    e.id,
    e.status,
    e.payment_status,
    p.title,
    e.updated_at
FROM enrollments e
JOIN participants pa ON pa.id = e.participant_id
JOIN programs p ON p.id = e.program_id
JOIN user_profiles up ON up.id = pa.user_id
WHERE up.email = 'yucheyahya@gmail.com'
ORDER BY e.updated_at DESC;

