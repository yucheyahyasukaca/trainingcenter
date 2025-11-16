-- ============================================================================
-- SIMPLE FIX: Update semua enrollment yang statusnya NULL
-- Versi lebih sederhana dan aman
-- ============================================================================

-- 1. Lihat dulu enrollment yang NULL
SELECT 
    e.id,
    e.status,
    e.payment_status,
    e.certificate_issued,
    p.title as program_title,
    p.price,
    pa.email
FROM enrollments e
JOIN programs p ON p.id = e.program_id
JOIN participants pa ON pa.id = e.participant_id
WHERE e.status IS NULL OR e.status = ''
ORDER BY e.created_at DESC;

-- 2. UPDATE SIMPLE: Set semua yang NULL jadi 'approved' (karena sudah enrolled)
UPDATE enrollments
SET 
    status = 'approved',
    updated_at = NOW()
WHERE status IS NULL OR status = '';

-- 3. Verify hasil
SELECT 
    e.id,
    e.status as new_status,
    e.payment_status,
    p.title as program_title,
    pa.email
FROM enrollments e
JOIN programs p ON p.id = e.program_id
JOIN participants pa ON pa.id = e.participant_id
WHERE pa.email = 'yucheyahya@gmail.com'
ORDER BY e.updated_at DESC;

-- 4. Count status setelah update
SELECT 
    status,
    COUNT(*) as jumlah
FROM enrollments
GROUP BY status
ORDER BY status;

