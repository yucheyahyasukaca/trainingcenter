-- ============================================================================
-- UPDATE PROGRAMS TABLE FOR NEW REQUIREMENTS
-- ============================================================================
-- This script:
-- 1. Creates program_categories table
-- 2. Modifies programs table to add new fields
-- 3. Creates functions for auto-approval and TOT trainer promotion
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE CATEGORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS program_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add default categories
INSERT INTO program_categories (name, description) VALUES
    ('Leadership', 'Program pengembangan kepemimpinan'),
    ('Technology', 'Program teknologi dan digital'),
    ('Marketing', 'Program pemasaran dan penjualan'),
    ('Finance', 'Program keuangan dan akuntansi'),
    ('Human Resources', 'Program pengembangan SDM'),
    ('Operations', 'Program operasional dan manajemen'),
    ('Sales', 'Program penjualan'),
    ('Customer Service', 'Program pelayanan pelanggan')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 2: MODIFY PROGRAMS TABLE
-- ============================================================================

-- Add new columns to programs table (satu per satu untuk menghindari error)
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) DEFAULT 'regular';

ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;

ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS registration_type VARCHAR(20) DEFAULT 'lifetime';

ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS registration_start_date DATE;

ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS registration_end_date DATE;

ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT false;

-- Add constraint for program_type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'programs_program_type_check'
    ) THEN
        ALTER TABLE programs 
        ADD CONSTRAINT programs_program_type_check 
        CHECK (program_type IN ('tot', 'regular'));
    END IF;
END $$;

-- Add constraint for registration_type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'programs_registration_type_check'
    ) THEN
        ALTER TABLE programs 
        ADD CONSTRAINT programs_registration_type_check 
        CHECK (registration_type IN ('lifetime', 'limited'));
    END IF;
END $$;

-- Make duration_days and max_participants nullable (optional)
ALTER TABLE programs 
ALTER COLUMN duration_days DROP NOT NULL;

ALTER TABLE programs 
ALTER COLUMN max_participants DROP NOT NULL;

-- Drop start_date and end_date columns (tidak diperlukan lagi)
ALTER TABLE programs 
DROP COLUMN IF EXISTS start_date;

ALTER TABLE programs 
DROP COLUMN IF EXISTS end_date;

-- Set default values for existing records
UPDATE programs 
SET program_type = 'regular',
    is_free = (price = 0),
    auto_approved = (price = 0),
    registration_type = 'lifetime'
WHERE program_type IS NULL;

-- ============================================================================
-- STEP 3: CREATE FUNCTION TO AUTO-APPROVE FREE PROGRAMS
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_approve_free_program_enrollments()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the program is free
    IF EXISTS (
        SELECT 1 FROM programs 
        WHERE id = NEW.program_id 
        AND is_free = true
    ) THEN
        -- Automatically approve the enrollment
        NEW.status := 'approved';
        NEW.payment_status := 'paid';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-approval
DROP TRIGGER IF EXISTS trigger_auto_approve_free_enrollments ON enrollments;
CREATE TRIGGER trigger_auto_approve_free_enrollments
    BEFORE INSERT ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION auto_approve_free_program_enrollments();

-- ============================================================================
-- STEP 4: CREATE FUNCTION TO PROMOTE TOT GRADUATES TO TRAINERS
-- ============================================================================

CREATE OR REPLACE FUNCTION promote_tot_graduates_to_trainers()
RETURNS TRIGGER AS $$
DECLARE
    v_program_type VARCHAR(20);
    v_participant_user_id UUID;
BEGIN
    -- Only process when enrollment is completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Check if this is a TOT program
        SELECT program_type INTO v_program_type
        FROM programs
        WHERE id = NEW.program_id;
        
        IF v_program_type = 'tot' THEN
            -- Get the user_id from participant
            SELECT user_id INTO v_participant_user_id
            FROM participants
            WHERE id = NEW.participant_id;
            
            -- Update user profile to trainer role with Level 0
            IF v_participant_user_id IS NOT NULL THEN
                UPDATE user_profiles
                SET 
                    role = 'trainer',
                    trainer_level = 'level_0',
                    updated_at = NOW()
                WHERE id = v_participant_user_id
                AND role NOT IN ('admin', 'manager'); -- Don't downgrade admins/managers
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for TOT trainer promotion
DROP TRIGGER IF EXISTS trigger_promote_tot_graduates ON enrollments;
CREATE TRIGGER trigger_promote_tot_graduates
    AFTER UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION promote_tot_graduates_to_trainers();

-- ============================================================================
-- STEP 5: CREATE FUNCTION TO CHECK REGISTRATION DATES
-- ============================================================================

CREATE OR REPLACE FUNCTION check_registration_dates()
RETURNS TRIGGER AS $$
DECLARE
    v_registration_type VARCHAR(20);
    v_reg_start_date DATE;
    v_reg_end_date DATE;
    v_current_date DATE := CURRENT_DATE;
BEGIN
    -- Get registration info
    SELECT registration_type, registration_start_date, registration_end_date
    INTO v_registration_type, v_reg_start_date, v_reg_end_date
    FROM programs
    WHERE id = NEW.program_id;
    
    -- Only check dates if registration is limited
    IF v_registration_type = 'limited' THEN
        IF v_reg_start_date IS NOT NULL AND v_current_date < v_reg_start_date THEN
            RAISE EXCEPTION 'Pendaftaran belum dibuka. Pendaftaran dimulai pada %', v_reg_start_date;
        END IF;
        
        IF v_reg_end_date IS NOT NULL AND v_current_date > v_reg_end_date THEN
            RAISE EXCEPTION 'Pendaftaran sudah ditutup. Pendaftaran berakhir pada %', v_reg_end_date;
        END IF;
    END IF;
    -- If lifetime, no date check needed
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for registration date validation
DROP TRIGGER IF EXISTS trigger_check_registration_dates ON enrollments;
CREATE TRIGGER trigger_check_registration_dates
    BEFORE INSERT ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION check_registration_dates();

-- ============================================================================
-- STEP 6: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_programs_program_type ON programs(program_type);
CREATE INDEX IF NOT EXISTS idx_programs_is_free ON programs(is_free);
CREATE INDEX IF NOT EXISTS idx_programs_registration_type ON programs(registration_type);
CREATE INDEX IF NOT EXISTS idx_programs_registration_dates ON programs(registration_start_date, registration_end_date);
CREATE INDEX IF NOT EXISTS idx_program_categories_name ON program_categories(name);

-- ============================================================================
-- STEP 7: CREATE UPDATED_AT TRIGGER FOR CATEGORIES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_program_categories_updated_at ON program_categories;
CREATE TRIGGER update_program_categories_updated_at
    BEFORE UPDATE ON program_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 8: ADD RLS POLICIES FOR CATEGORIES
-- ============================================================================

ALTER TABLE program_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view program categories" ON program_categories;
DROP POLICY IF EXISTS "Admin and Manager can insert categories" ON program_categories;
DROP POLICY IF EXISTS "Admin and Manager can update categories" ON program_categories;
DROP POLICY IF EXISTS "Admin and Manager can delete categories" ON program_categories;

-- Everyone can read categories
CREATE POLICY "Anyone can view program categories" ON program_categories
    FOR SELECT USING (true);

-- Only admin and manager can insert/update/delete categories
CREATE POLICY "Admin and Manager can insert categories" ON program_categories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admin and Manager can update categories" ON program_categories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admin and Manager can delete categories" ON program_categories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✓ Programs table updated successfully';
    RAISE NOTICE '✓ Program categories table created';
    RAISE NOTICE '✓ Auto-approval for free programs enabled';
    RAISE NOTICE '✓ TOT trainer promotion enabled';
    RAISE NOTICE '✓ Registration date validation enabled';
    RAISE NOTICE '✓ Start_date and end_date removed';
    RAISE NOTICE '✓ Registration type (Lifetime/Limited) added';
END $$;
