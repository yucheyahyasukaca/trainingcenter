-- Check enrollment status untuk debugging
-- Jalankan di Supabase SQL Editor

-- 1. Lihat semua enrollment dengan statusnya
SELECT 
    e.id,
    e.status,
    e.created_at,
    p.title as program_title,
    p.program_type,
    pa.name as participant_name,
    pa.email as participant_email,
    up.role as user_role,
    up.trainer_level
FROM enrollments e
JOIN programs p ON p.id = e.program_id
JOIN participants pa ON pa.id = e.participant_id
LEFT JOIN user_profiles up ON up.id = pa.user_id
ORDER BY e.created_at DESC
LIMIT 20;

-- 2. Hitung jumlah enrollment per status
SELECT 
    status,
    COUNT(*) as count
FROM enrollments
GROUP BY status;

-- 3. Cek enrollment yang sudah generate sertifikat tapi belum completed
SELECT 
    e.id,
    e.status,
    e.certificate_issued,
    p.title as program_title,
    pa.name as participant_name
FROM enrollments e
JOIN programs p ON p.id = e.program_id
JOIN participants pa ON pa.id = e.participant_id
WHERE e.certificate_issued = TRUE 
  AND e.status != 'completed';

-- 4. Cek enrollment TOT yang seharusnya sudah completed
SELECT 
    e.id,
    e.status,
    e.certificate_issued,
    p.title as program_title,
    p.program_type,
    pa.name as participant_name,
    pa.email
FROM enrollments e
JOIN programs p ON p.id = e.program_id
JOIN participants pa ON pa.id = e.participant_id
WHERE p.program_type = 'tot'
  AND (e.status = 'approved' OR e.certificate_issued = TRUE)
ORDER BY e.created_at DESC;

