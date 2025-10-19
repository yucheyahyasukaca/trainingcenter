-- ============================================================================
-- QUICK FIX: Add Missing Columns to Programs Table
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script adds missing columns to existing programs table
-- WITHOUT dropping the table (safer approach)
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK CURRENT SCHEMA
-- ============================================================================

SELECT 'Checking current programs schema...' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'programs' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 2: ADD MISSING COLUMNS
-- ============================================================================

SELECT 'Adding missing columns...' as step;

-- Add duration_days column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'programs' 
        AND column_name = 'duration_days'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE programs ADD COLUMN duration_days INTEGER DEFAULT 1;
        RAISE NOTICE 'Added duration_days column';
    ELSE
        RAISE NOTICE 'duration_days column already exists';
    END IF;
END $$;

-- Add current_participants column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'programs' 
        AND column_name = 'current_participants'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE programs ADD COLUMN current_participants INTEGER DEFAULT 0;
        RAISE NOTICE 'Added current_participants column';
    ELSE
        RAISE NOTICE 'current_participants column already exists';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'programs' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE programs ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
        RAISE NOTICE 'Added updated_at column';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- Add whatsapp_group_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'programs' 
        AND column_name = 'whatsapp_group_url'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE programs ADD COLUMN whatsapp_group_url TEXT;
        RAISE NOTICE 'Added whatsapp_group_url column';
    ELSE
        RAISE NOTICE 'whatsapp_group_url column already exists';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: UPDATE EXISTING DATA
-- ============================================================================

SELECT 'Updating existing data...' as step;

-- Update duration_days for existing records that might be NULL
UPDATE programs 
SET duration_days = 1 
WHERE duration_days IS NULL;

-- Update current_participants for existing records that might be NULL
UPDATE programs 
SET current_participants = 0 
WHERE current_participants IS NULL;

-- Update updated_at for existing records
UPDATE programs 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- ============================================================================
-- STEP 4: CREATE INDEXES
-- ============================================================================

SELECT 'Creating indexes...' as step;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_programs_duration_days ON programs(duration_days);
CREATE INDEX IF NOT EXISTS idx_programs_current_participants ON programs(current_participants);
CREATE INDEX IF NOT EXISTS idx_programs_updated_at ON programs(updated_at);

-- ============================================================================
-- STEP 5: VERIFY SCHEMA
-- ============================================================================

SELECT 'Verifying schema...' as step;

-- Check programs table structure again
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'programs' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test queries
SELECT 'Testing programs query...' as test_name;
SELECT 
    id, 
    title, 
    duration_days,
    max_participants,
    current_participants,
    price, 
    status 
FROM programs 
LIMIT 3;

-- ============================================================================
-- STEP 6: REFRESH SCHEMA CACHE
-- ============================================================================

SELECT 'Refreshing schema cache...' as step;

-- Force refresh of schema cache by querying the table
SELECT COUNT(*) as program_count FROM programs;

-- Test insert with all columns
INSERT INTO programs (
    title,
    description,
    category,
    duration_days,
    max_participants,
    current_participants,
    price,
    status,
    start_date,
    end_date
)
VALUES (
    'Test Program Schema Fix',
    'Test Description',
    'Test Category',
    7,
    20,
    0,
    1000000,
    'draft',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days'
)
ON CONFLICT (title) DO NOTHING;

-- ============================================================================
-- QUICK FIX COMPLETE!
-- ============================================================================
-- 
-- The programs table now has all required columns:
-- ✅ duration_days
-- ✅ current_participants  
-- ✅ updated_at
-- ✅ whatsapp_group_url
-- 
-- The schema cache should now recognize all columns.
-- Try updating a program again - the error should be gone!
-- ============================================================================
