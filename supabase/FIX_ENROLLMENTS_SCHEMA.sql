-- ============================================================================
-- FIX: Enrollments Schema Missing Columns
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- Error: "Could not find the 'amount_paid' column of 'enrollments' in the schema cache"
-- 
-- This script fixes the enrollments table schema to match the application requirements
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK CURRENT ENROLLMENTS TABLE SCHEMA
-- ============================================================================

SELECT 'Checking enrollments table schema...' as step;

-- Check if enrollments table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'enrollments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 2: BACKUP EXISTING DATA
-- ============================================================================

SELECT 'Backing up existing data...' as step;

-- Create backup table
CREATE TABLE IF NOT EXISTS enrollments_backup AS 
SELECT * FROM enrollments;

-- ============================================================================
-- STEP 3: FIX ENROLLMENTS TABLE SCHEMA
-- ============================================================================

SELECT 'Fixing enrollments table schema...' as step;

-- Drop existing enrollments table
DROP TABLE IF EXISTS enrollments CASCADE;

-- Create enrollments table with correct schema
CREATE TABLE enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    payment_proof_url TEXT,
    notes TEXT,
    UNIQUE(program_id, participant_id)
);

-- ============================================================================
-- STEP 4: RESTORE DATA FROM BACKUP
-- ============================================================================

SELECT 'Restoring data from backup...' as step;

-- Insert data from backup (only columns that exist in both schemas)
INSERT INTO enrollments (
    id,
    created_at,
    program_id,
    participant_id,
    status,
    payment_status,
    amount_paid,
    notes
)
SELECT 
    id,
    created_at,
    program_id,
    participant_id,
    status,
    payment_status,
    COALESCE(amount_paid, 0) as amount_paid,
    notes
FROM enrollments_backup
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 5: CREATE INDEXES
-- ============================================================================

SELECT 'Creating indexes...' as step;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enrollments_program_id ON enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_participant_id ON enrollments(participant_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_status ON enrollments(payment_status);

-- ============================================================================
-- STEP 6: ENABLE RLS
-- ============================================================================

SELECT 'Enabling RLS...' as step;

-- Enable RLS
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Create simple policies for development
CREATE POLICY "enrollments_select_all" ON enrollments FOR SELECT USING (true);
CREATE POLICY "enrollments_insert_all" ON enrollments FOR INSERT WITH CHECK (true);
CREATE POLICY "enrollments_update_all" ON enrollments FOR UPDATE USING (true);
CREATE POLICY "enrollments_delete_all" ON enrollments FOR DELETE USING (true);

-- ============================================================================
-- STEP 7: INSERT SAMPLE DATA
-- ============================================================================

SELECT 'Inserting sample data...' as step;

-- Insert sample enrollments if none exist
INSERT INTO enrollments (id, program_id, participant_id, status, payment_status, amount_paid, notes, created_at, updated_at)
SELECT 
    '750e8400-e29b-41d4-a716-446655440001'::uuid,
    p.id,
    part.id,
    'approved',
    'paid',
    2500000,
    'Sample enrollment for testing',
    NOW(),
    NOW()
FROM programs p, participants part
WHERE p.title LIKE '%AI%' AND part.name LIKE '%User%'
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 8: VERIFY SCHEMA
-- ============================================================================

SELECT 'Verifying schema...' as step;

-- Check enrollments table structure
SELECT 
    'enrollments' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'enrollments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test queries
SELECT 'Testing enrollments query...' as test_name;
SELECT 
    id, 
    program_id, 
    participant_id, 
    status, 
    payment_status, 
    amount_paid,
    payment_proof_url
FROM enrollments 
LIMIT 3;

-- Test insert with all columns
SELECT 'Testing insert with all columns...' as test_name;
INSERT INTO enrollments (
    program_id,
    class_id,
    participant_id,
    status,
    payment_status,
    amount_paid,
    payment_proof_url,
    notes
)
SELECT 
    (SELECT id FROM programs LIMIT 1),
    NULL,
    (SELECT id FROM participants LIMIT 1),
    'pending',
    'unpaid',
    0,
    NULL,
    'Test enrollment'
WHERE NOT EXISTS (
    SELECT 1 FROM enrollments 
    WHERE program_id = (SELECT id FROM programs LIMIT 1)
    AND participant_id = (SELECT id FROM participants LIMIT 1)
);

-- ============================================================================
-- STEP 9: CLEANUP
-- ============================================================================

SELECT 'Cleaning up...' as step;

-- Drop backup table
DROP TABLE IF EXISTS enrollments_backup;

-- ============================================================================
-- FIX COMPLETE!
-- ============================================================================
-- 
-- The enrollments table has been fixed with the correct schema.
-- All required columns are now available:
-- ✅ amount_paid
-- ✅ class_id  
-- ✅ payment_proof_url
-- ✅ updated_at
-- 
-- The application should now work without schema cache errors.
-- ============================================================================
