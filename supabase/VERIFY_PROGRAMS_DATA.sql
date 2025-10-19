-- ============================================================================
-- VERIFY PROGRAMS DATA
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script verifies that programs data exists and is accessible
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK PROGRAMS DATA
-- ============================================================================

-- Check if programs exist
SELECT 'Programs Count' as check_name, COUNT(*) as count FROM programs;

-- Check programs details
SELECT 
    id,
    title,
    description,
    category,
    price,
    status,
    created_at
FROM programs 
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 2: CHECK RLS POLICIES
-- ============================================================================

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'programs';

-- Check policies on programs table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'programs';

-- ============================================================================
-- STEP 3: TEST QUERIES
-- ============================================================================

-- Test simple programs query
SELECT 'Simple Programs Query' as test_name;
SELECT * FROM programs LIMIT 5;

-- Test programs with status filter
SELECT 'Programs by Status' as test_name;
SELECT 
    status,
    COUNT(*) as count
FROM programs 
GROUP BY status;

-- Test programs by category
SELECT 'Programs by Category' as test_name;
SELECT 
    category,
    COUNT(*) as count
FROM programs 
GROUP BY category;

-- ============================================================================
-- STEP 4: FIX PROGRAMS DATA IF NEEDED
-- ============================================================================

-- Ensure all programs have proper status
UPDATE programs 
SET status = 'published' 
WHERE status IS NULL OR status = '';

-- Ensure all programs have proper category
UPDATE programs 
SET category = 'General' 
WHERE category IS NULL OR category = '';

-- Ensure all programs have proper price
UPDATE programs 
SET price = 0 
WHERE price IS NULL;

-- ============================================================================
-- STEP 5: CREATE MISSING PROGRAMS IF NONE EXIST
-- ============================================================================

-- Insert sample programs if none exist
INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, created_at, updated_at)
SELECT 
    '550e8400-e29b-41d4-a716-446655440001',
    'AI & Machine Learning Fundamentals',
    'Pelatihan dasar AI dan Machine Learning untuk pemula. Mempelajari konsep dasar, algoritma, dan implementasi praktis.',
    'Technology',
    2500000,
    '2024-02-01',
    '2024-02-28',
    30,
    5,
    'published',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM programs WHERE id = '550e8400-e29b-41d4-a716-446655440001');

INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, created_at, updated_at)
SELECT 
    '550e8400-e29b-41d4-a716-446655440002',
    'Digital Marketing Strategy',
    'Strategi pemasaran digital untuk bisnis modern. Mempelajari SEO, SEM, social media marketing, dan analitik.',
    'Marketing',
    1500000,
    '2024-03-01',
    '2024-03-15',
    25,
    3,
    'published',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM programs WHERE id = '550e8400-e29b-41d4-a716-446655440002');

INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, created_at, updated_at)
SELECT 
    '550e8400-e29b-41d4-a716-446655440003',
    'Data Science & Analytics',
    'Analisis data dan ilmu data untuk pengambilan keputusan. Mempelajari Python, R, SQL, dan machine learning.',
    'Technology',
    3000000,
    '2024-04-01',
    '2024-04-30',
    20,
    2,
    'published',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM programs WHERE id = '550e8400-e29b-41d4-a716-446655440003');

INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, created_at, updated_at)
SELECT 
    '550e8400-e29b-41d4-a716-446655440004',
    'Leadership & Management',
    'Kepemimpinan dan manajemen tim yang efektif. Mempelajari soft skills, team building, dan strategic thinking.',
    'Leadership',
    2000000,
    '2024-05-01',
    '2024-05-20',
    15,
    1,
    'published',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM programs WHERE id = '550e8400-e29b-41d4-a716-446655440004');

INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, created_at, updated_at)
SELECT 
    '550e8400-e29b-41d4-a716-446655440005',
    'Web Development Bootcamp',
    'Bootcamp pengembangan web full-stack. Mempelajari HTML, CSS, JavaScript, React, Node.js, dan database.',
    'Technology',
    4000000,
    '2024-06-01',
    '2024-06-30',
    35,
    8,
    'published',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM programs WHERE id = '550e8400-e29b-41d4-a716-446655440005');

-- ============================================================================
-- STEP 6: VERIFY FINAL DATA
-- ============================================================================

-- Final verification
SELECT 'Final Programs Count' as check_name, COUNT(*) as count FROM programs;

-- Check published programs
SELECT 'Published Programs' as check_name, COUNT(*) as count FROM programs WHERE status = 'published';

-- Check programs by category
SELECT 
    'Programs by Category' as check_name,
    category,
    COUNT(*) as count
FROM programs 
GROUP BY category
ORDER BY count DESC;

-- Test the exact query used in the application
SELECT 'Application Query Test' as test_name;
SELECT 
    id,
    title,
    description,
    category,
    price,
    status,
    created_at
FROM programs 
ORDER BY created_at DESC;

-- ============================================================================
-- VERIFICATION COMPLETE!
-- ============================================================================
-- 
-- Programs data should now be available and accessible!
-- 
-- What was checked:
-- ✅ Programs count and details
-- ✅ RLS policies status
-- ✅ Query functionality
-- ✅ Data integrity
-- ✅ Sample data creation
-- 
-- Your application should now display programs correctly!
-- ============================================================================

