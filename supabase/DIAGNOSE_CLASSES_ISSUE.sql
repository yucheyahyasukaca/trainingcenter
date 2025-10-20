-- ============================================================================
-- SIMPLE CHECK AND FIX FOR CLASSES TABLE
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script checks if classes table exists and creates it if needed
-- Run this FIRST to diagnose the issue
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK IF TABLES EXIST
-- ============================================================================

SELECT 'Checking if tables exist...' as step;

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('classes', 'class_trainers', 'programs', 'trainers')
ORDER BY table_name;

-- ============================================================================
-- STEP 2: CHECK CLASSES TABLE STRUCTURE (IF EXISTS)
-- ============================================================================

SELECT 'Checking classes table structure...' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'classes' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 3: CHECK RLS STATUS
-- ============================================================================

SELECT 'Checking RLS status...' as step;

SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('classes', 'class_trainers')
    AND schemaname = 'public';

-- ============================================================================
-- STEP 4: CHECK RLS POLICIES
-- ============================================================================

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
WHERE tablename IN ('classes', 'class_trainers')
ORDER BY tablename, policyname;

-- ============================================================================
-- STEP 5: TEST BASIC QUERY
-- ============================================================================

SELECT 'Testing basic query...' as step;

-- Try to select from classes table
SELECT COUNT(*) as classes_count FROM classes;

-- Try to select from programs table
SELECT COUNT(*) as programs_count FROM programs;

-- Try to select from trainers table
SELECT COUNT(*) as trainers_count FROM trainers;

-- ============================================================================
-- STEP 6: CHECK FOREIGN KEY CONSTRAINTS
-- ============================================================================

SELECT 'Checking foreign key constraints...' as step;

SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('classes', 'class_trainers')
ORDER BY tc.table_name;

-- ============================================================================
-- STEP 7: CHECK SAMPLE DATA
-- ============================================================================

SELECT 'Checking sample data...' as step;

-- Check programs
SELECT 
    id,
    title,
    status
FROM programs
ORDER BY title
LIMIT 5;

-- Check classes (if any exist)
SELECT 
    c.id,
    c.name,
    c.program_id,
    p.title as program_title,
    c.status
FROM classes c
JOIN programs p ON c.program_id = p.id
ORDER BY p.title, c.name
LIMIT 10;

-- ============================================================================
-- DIAGNOSIS COMPLETE!
-- ============================================================================
-- 
-- After running this script, you should see:
-- 1. Which tables exist
-- 2. Classes table structure (if it exists)
-- 3. RLS status and policies
-- 4. Any foreign key issues
-- 5. Sample data
-- 
-- If classes table doesn't exist or has issues, run:
-- FIX_CLASSES_TABLE_COMPLETE.sql
-- ============================================================================

