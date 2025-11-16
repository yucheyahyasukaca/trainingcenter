-- ============================================================================
-- SYNC: Update enrollment status ke 'completed' jika sertifikat sudah ada
-- ============================================================================

-- 1. Cek sertifikat yang sudah diterbitkan tapi enrollment masih 'approved'
SELECT 
    c.id as certificate_id,
    c.certificate_number,
    c.issued_at,
    c.recipient_type,
    c.recipient_id,
    e.id as enrollment_id,
    e.status as current_enrollment_status,
    p.title as program_title,
    pa.email
FROM certificates c
JOIN programs p ON p.id = c.program_id
LEFT JOIN participants pa ON pa.id = c.recipient_id AND c.recipient_type = 'participant'
LEFT JOIN enrollments e ON e.program_id = c.program_id AND e.participant_id = c.recipient_id
WHERE c.recipient_type = 'participant'
  AND pa.email = 'yucheyahya@gmail.com'
  AND (e.status IS NULL OR e.status != 'completed');

-- 2. UPDATE enrollment status ke 'completed' untuk yang sudah punya sertifikat
UPDATE enrollments e
SET 
    status = 'completed',
    certificate_issued = TRUE,
    updated_at = NOW()
FROM certificates c
JOIN participants pa ON pa.id = c.recipient_id
WHERE c.recipient_type = 'participant'
  AND e.program_id = c.program_id
  AND e.participant_id = c.recipient_id
  AND pa.email = 'yucheyahya@gmail.com'
  AND e.status != 'completed';

-- 3. Verify hasil update
SELECT 
    e.id as enrollment_id,
    e.status as NEW_status,
    e.certificate_issued,
    p.title as program_title,
    c.certificate_number,
    pa.email
FROM enrollments e
JOIN programs p ON p.id = e.program_id
JOIN participants pa ON pa.id = e.participant_id
LEFT JOIN certificates c ON c.program_id = e.program_id 
    AND c.recipient_id = e.participant_id 
    AND c.recipient_type = 'participant'
WHERE pa.email = 'yucheyahya@gmail.com'
ORDER BY e.updated_at DESC;

-- 4. Summary: Enrollment status count
SELECT 
    e.status,
    COUNT(*) as jumlah
FROM enrollments e
JOIN participants pa ON pa.id = e.participant_id
WHERE pa.email = 'yucheyahya@gmail.com'
GROUP BY e.status;

