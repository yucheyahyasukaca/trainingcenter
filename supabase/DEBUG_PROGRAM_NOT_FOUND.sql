-- ============================================================================
-- DEBUG: Program Tidak Ditemukan
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- Script ini untuk debug masalah "Program Tidak Ditemukan"
-- Jalankan di Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK PROGRAMS TABLE
-- ============================================================================

-- Check if programs table exists and has data
SELECT 'Checking programs table...' as step;

SELECT 
    id,
    title,
    status,
    created_at
FROM programs 
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 2: CHECK SPECIFIC PROGRAM IDS
-- ============================================================================

-- Check if specific program IDs exist
SELECT 'Checking specific program IDs...' as step;

-- Try to find programs with common ID patterns
SELECT id, title, status FROM programs WHERE id LIKE '%550e8400%';
SELECT id, title, status FROM programs WHERE id LIKE '%e29b%';
SELECT id, title, status FROM programs WHERE id LIKE '%a716%';

-- ============================================================================
-- STEP 3: CHECK RLS POLICIES
-- ============================================================================

-- Check RLS policies on programs table
SELECT 'Checking RLS policies...' as step;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'programs';

-- ============================================================================
-- STEP 4: TEST QUERIES
-- ============================================================================

-- Test the exact query used in the application
SELECT 'Testing application queries...' as step;

-- Test 1: Simple query (should work)
SELECT 'Test 1: Simple query' as test_name;
SELECT * FROM programs WHERE status = 'published' LIMIT 5;

-- Test 2: Query with specific ID (replace with actual ID from step 2)
SELECT 'Test 2: Query with specific ID' as test_name;
-- Replace 'YOUR_PROGRAM_ID_HERE' with actual ID from step 2
-- SELECT * FROM programs WHERE id = 'YOUR_PROGRAM_ID_HERE';

-- Test 3: Query with classes join
SELECT 'Test 3: Query with classes join' as test_name;
SELECT 
    p.*,
    c.id as class_id,
    c.name as class_name
FROM programs p
LEFT JOIN classes c ON p.id = c.program_id
WHERE p.status = 'published'
LIMIT 3;

-- ============================================================================
-- STEP 5: CREATE MISSING DATA IF NEEDED
-- ============================================================================

-- If no programs found, create some test data
SELECT 'Creating test data if needed...' as step;

-- Check if we need to create data
DO $$
DECLARE
    program_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO program_count FROM programs WHERE status = 'published';
    
    IF program_count = 0 THEN
        RAISE NOTICE 'No published programs found, creating test data...';
        
        -- Insert test program
        INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, created_at, updated_at)
        VALUES (
            'test-program-001',
            'Test Program - AI Fundamentals',
            'Program test untuk debugging',
            'Technology',
            1000000,
            '2024-12-01',
            '2024-12-31',
            20,
            0,
            'published',
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Test program created with ID: test-program-001';
    ELSE
        RAISE NOTICE 'Found % published programs', program_count;
    END IF;
END $$;

-- ============================================================================
-- STEP 6: FINAL VERIFICATION
-- ============================================================================

-- Final check
SELECT 'Final verification...' as step;

SELECT 
    COUNT(*) as total_programs,
    COUNT(CASE WHEN status = 'published' THEN 1 END) as published_programs,
    COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_programs,
    COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_programs
FROM programs;

-- Show all published programs
SELECT 
    id,
    title,
    status,
    price,
    start_date,
    end_date
FROM programs 
WHERE status = 'published'
ORDER BY created_at DESC;

-- ============================================================================
-- DEBUG COMPLETE!
-- ============================================================================
-- 
-- Jika masih ada masalah:
-- 1. Pastikan ada program dengan status 'published'
-- 2. Pastikan RLS policies tidak memblokir akses
-- 3. Cek console browser untuk error detail
-- 4. Pastikan program ID di URL benar
-- ============================================================================
