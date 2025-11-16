-- ============================================================================
-- FIX NULL ENROLLMENT STATUS
-- Memperbaiki enrollment yang statusnya NULL
-- ============================================================================

-- 1. CEK: Lihat enrollment yang statusnya NULL
SELECT 
    e.id,
    e.status,
    e.payment_status,
    e.amount_paid,
    e.certificate_issued,
    p.id as program_id,
    p.title as program_title,
    p.price,
    pa.name as participant_name,
    pa.email
FROM enrollments e
JOIN programs p ON p.id = e.program_id
JOIN participants pa ON pa.id = e.participant_id
WHERE e.status IS NULL OR e.status = '';

-- 2. FIX: Update enrollment yang NULL menjadi 'approved' jika sudah bayar atau program gratis
UPDATE enrollments
SET status = CASE
    -- Jika sudah ada sertifikat, set completed
    WHEN certificate_issued = TRUE THEN 'completed'
    -- Jika payment_status paid, set approved
    WHEN payment_status = 'paid' THEN 'approved'
    -- Jika program gratis (price = 0), set approved
    WHEN program_id IN (SELECT id FROM programs WHERE price = 0) THEN 'approved'
    -- Default: pending
    ELSE 'pending'
END,
updated_at = NOW()
WHERE status IS NULL OR status = '';

-- 3. VERIFY: Cek lagi setelah update
SELECT 
    e.id,
    e.status,
    e.payment_status,
    p.title as program_title,
    pa.name as participant_name
FROM enrollments e
JOIN programs p ON p.id = e.program_id
JOIN participants pa ON pa.id = e.participant_id
ORDER BY e.updated_at DESC
LIMIT 20;

-- 4. INFO: Tampilkan summary
SELECT 
    status,
    COUNT(*) as jumlah
FROM enrollments
GROUP BY status
ORDER BY status;

