-- ============================================================================
-- CEK: Apakah enrollment user ini benar-benar ada di database?
-- ============================================================================

-- 1. Cek user profile
SELECT 
    'USER PROFILE' as check_type,
    id,
    email,
    full_name,
    role
FROM user_profiles
WHERE email = 'yucheyahya@gmail.com';

-- 2. Cek participant record
SELECT 
    'PARTICIPANT' as check_type,
    pa.id,
    pa.user_id,
    pa.email,
    pa.name
FROM participants pa
JOIN user_profiles up ON up.id = pa.user_id
WHERE up.email = 'yucheyahya@gmail.com';

-- 3. Cek apakah ADA enrollment untuk program Gemini
SELECT 
    'ENROLLMENT EXISTS?' as check_type,
    COUNT(*) as enrollment_count
FROM enrollments e
JOIN participants pa ON pa.id = e.participant_id
JOIN user_profiles up ON up.id = pa.user_id
JOIN programs p ON p.id = e.program_id
WHERE up.email = 'yucheyahya@gmail.com'
  AND p.title ILIKE '%gemini%';

-- 4. Lihat SEMUA enrollment user ini (TANPA FILTER STATUS)
SELECT 
    'ALL ENROLLMENTS' as check_type,
    e.id,
    e.status,
    e.payment_status,
    e.created_at,
    p.id as program_id,
    p.title as program_title
FROM enrollments e
JOIN participants pa ON pa.id = e.participant_id
JOIN user_profiles up ON up.id = pa.user_id
JOIN programs p ON p.id = e.program_id
WHERE up.email = 'yucheyahya@gmail.com'
ORDER BY e.created_at DESC;

-- 5. Cek RLS policies untuk enrollments table
SELECT 
    'RLS POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'enrollments';

