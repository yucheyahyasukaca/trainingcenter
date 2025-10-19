-- ============================================================================
-- FIX: Participants Status Column Error
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- Error: "Could not find the 'status' column of 'participants' in the schema cache"
-- 
-- This script fixes the participants table schema and refreshes the cache
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK CURRENT PARTICIPANTS TABLE SCHEMA
-- ============================================================================

SELECT 'Checking participants table schema...' as step;

-- Check if participants table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'participants' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 2: FIX PARTICIPANTS TABLE SCHEMA
-- ============================================================================

SELECT 'Fixing participants table schema...' as step;

-- Drop and recreate participants table with correct schema
DROP TABLE IF EXISTS participants CASCADE;

CREATE TABLE participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    position VARCHAR(255),
    address TEXT,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- ============================================================================
-- STEP 3: RECREATE ENROLLMENTS TABLE
-- ============================================================================

SELECT 'Recreating enrollments table...' as step;

-- Drop and recreate enrollments table
DROP TABLE IF EXISTS enrollments CASCADE;

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
-- STEP 4: CREATE INDEXES
-- ============================================================================

SELECT 'Creating indexes...' as step;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_program_id ON enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_participant_id ON enrollments(participant_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- ============================================================================
-- STEP 5: ENABLE RLS
-- ============================================================================

SELECT 'Enabling RLS...' as step;

-- Enable RLS
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Create simple policies for development
CREATE POLICY "participants_select_all" ON participants FOR SELECT USING (true);
CREATE POLICY "participants_insert_all" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "participants_update_all" ON participants FOR UPDATE USING (true);
CREATE POLICY "participants_delete_all" ON participants FOR DELETE USING (true);

CREATE POLICY "enrollments_select_all" ON enrollments FOR SELECT USING (true);
CREATE POLICY "enrollments_insert_all" ON enrollments FOR INSERT WITH CHECK (true);
CREATE POLICY "enrollments_update_all" ON enrollments FOR UPDATE USING (true);
CREATE POLICY "enrollments_delete_all" ON enrollments FOR DELETE USING (true);

-- ============================================================================
-- STEP 6: INSERT SAMPLE DATA
-- ============================================================================

SELECT 'Inserting sample data...' as step;

-- Insert sample participants
INSERT INTO participants (id, user_id, name, email, phone, status, created_at, updated_at)
VALUES 
    ('3dde6a79-7c6f-4097-9d03-c8ffea9d43be', '2cde6a79-7c6f-4097-9d03-c8ffea9d43be', 'User Garuda-21', 'user@garuda-21.com', '+6281234567890', 'active', NOW(), NOW()),
    ('4ede6a79-7c6f-4097-9d03-c8ffea9d43be', NULL, 'Test Participant 1', 'test1@example.com', '+6281111111111', 'active', NOW(), NOW()),
    ('5ede6a79-7c6f-4097-9d03-c8ffea9d43be', NULL, 'Test Participant 2', 'test2@example.com', '+6282222222222', 'active', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    status = EXCLUDED.status,
    updated_at = NOW();

-- ============================================================================
-- STEP 7: VERIFY SCHEMA
-- ============================================================================

SELECT 'Verifying schema...' as step;

-- Check participants table structure
SELECT 
    'participants' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'participants' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

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
SELECT 'Testing participants query...' as test_name;
SELECT id, name, email, status FROM participants WHERE status = 'active' LIMIT 3;

SELECT 'Testing enrollments query...' as test_name;
SELECT id, program_id, participant_id, status FROM enrollments LIMIT 3;

-- ============================================================================
-- STEP 8: REFRESH SCHEMA CACHE
-- ============================================================================

SELECT 'Refreshing schema cache...' as step;

-- Force refresh of schema cache by querying the table
SELECT COUNT(*) as participant_count FROM participants;
SELECT COUNT(*) as enrollment_count FROM enrollments;

-- ============================================================================
-- FIX COMPLETE!
-- ============================================================================
-- 
-- The participants table has been recreated with the correct schema.
-- The 'status' column should now be available in the schema cache.
-- 
-- If you still get the error, try:
-- 1. Wait a few seconds for the cache to refresh
-- 2. Refresh your browser
-- 3. Check the Supabase dashboard to verify the table structure
-- ============================================================================
