-- ============================================================================
-- FIX DUPLICATE USER_ID COLUMN IN PARTICIPANTS TABLE
-- ============================================================================

-- Step 1: Check current table structure
-- ============================================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'participants' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Drop and recreate participants table with correct structure
-- ============================================================================

-- First, backup existing data - explicitly select columns to avoid duplicates
CREATE TEMP TABLE participants_backup AS 
SELECT DISTINCT ON (id)
    id,
    created_at,
    updated_at,
    name,
    email,
    phone,
    address,
    date_of_birth,
    gender,
    emergency_contact_name,
    emergency_contact_phone
FROM participants
ORDER BY id;

-- Drop existing table (cascade will handle foreign key constraints)
DROP TABLE IF EXISTS participants CASCADE;

-- Recreate participants table with correct structure
CREATE TABLE participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Step 3: Restore data from backup (if needed)
-- ============================================================================

-- Restore participants from backup
INSERT INTO participants (id, created_at, updated_at, name, email, phone, address, date_of_birth, gender, emergency_contact_name, emergency_contact_phone, status)
SELECT DISTINCT ON (id)
    id,
    created_at,
    updated_at,
    name,
    email,
    phone,
    address,
    date_of_birth,
    gender,
    emergency_contact_name,
    emergency_contact_phone,
    'active'
FROM participants_backup
WHERE NOT EXISTS (
    SELECT 1 FROM participants p2 WHERE p2.id = participants_backup.id
)
ORDER BY id;

-- Drop backup table
DROP TABLE IF EXISTS participants_backup;

-- Link participants with auth.users by email
UPDATE participants p
SET user_id = au.id
FROM auth.users au
WHERE p.email = au.email AND p.user_id IS NULL;

-- Step 4: Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);

-- Step 5: Enable RLS
-- ============================================================================

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own participant record" ON participants;
DROP POLICY IF EXISTS "Users can insert their own participant record" ON participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON participants;
DROP POLICY IF EXISTS "Admins and managers can manage all participants" ON participants;
DROP POLICY IF EXISTS "participants_select_all" ON participants;
DROP POLICY IF EXISTS "participants_insert_all" ON participants;
DROP POLICY IF EXISTS "participants_update_all" ON participants;
DROP POLICY IF EXISTS "participants_delete_all" ON participants;

-- Create RLS policies
CREATE POLICY "Users can view their own participant record" ON participants
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Users can insert their own participant record" ON participants
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participant record" ON participants
FOR UPDATE USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins and managers can manage all participants" ON participants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Step 6: Recreate enrollments table if needed
-- ============================================================================

-- Check if enrollments table needs class_id column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'class_id') THEN
        ALTER TABLE enrollments ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 7: Output summary
-- ============================================================================

DO $$
DECLARE
  participant_count INTEGER;
  user_participants INTEGER;
BEGIN
  SELECT COUNT(*) INTO participant_count FROM participants;
  SELECT COUNT(*) INTO user_participants FROM participants WHERE user_id IS NOT NULL;
  
  RAISE NOTICE 'Fix complete. Summary:';
  RAISE NOTICE '- Total participants: %', participant_count;
  RAISE NOTICE '- Participants with user_id: %', user_participants;
END $$;
