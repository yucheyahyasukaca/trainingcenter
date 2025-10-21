-- ============================================================================
-- SIMPLE PROGRAM UPDATE - MINIMAL VERSION
-- ============================================================================
-- Script ini hanya menambahkan yang benar-benar diperlukan
-- TIDAK menghapus field yang sudah ada untuk menghindari error
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
-- STEP 2: ADD NEW COLUMNS TO PROGRAMS (one by one)
-- ============================================================================

-- Tambah kolom program_type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'programs' AND column_name = 'program_type'
    ) THEN
        ALTER TABLE programs ADD COLUMN program_type VARCHAR(20) DEFAULT 'regular';
    END IF;
END $$;

-- Tambah kolom is_free
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'programs' AND column_name = 'is_free'
    ) THEN
        ALTER TABLE programs ADD COLUMN is_free BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Tambah kolom registration_type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'programs' AND column_name = 'registration_type'
    ) THEN
        ALTER TABLE programs ADD COLUMN registration_type VARCHAR(20) DEFAULT 'lifetime';
    END IF;
END $$;

-- Tambah kolom registration_start_date
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'programs' AND column_name = 'registration_start_date'
    ) THEN
        ALTER TABLE programs ADD COLUMN registration_start_date DATE;
    END IF;
END $$;

-- Tambah kolom registration_end_date
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'programs' AND column_name = 'registration_end_date'
    ) THEN
        ALTER TABLE programs ADD COLUMN registration_end_date DATE;
    END IF;
END $$;

-- Tambah kolom auto_approved
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'programs' AND column_name = 'auto_approved'
    ) THEN
        ALTER TABLE programs ADD COLUMN auto_approved BOOLEAN DEFAULT false;
    END IF;
END $$;

-- ============================================================================
-- STEP 3: UPDATE EXISTING DATA
-- ============================================================================

UPDATE programs 
SET 
    program_type = 'regular',
    is_free = (price = 0 OR price IS NULL),
    registration_type = 'lifetime',
    auto_approved = (price = 0 OR price IS NULL)
WHERE program_type IS NULL;

-- ============================================================================
-- STEP 4: AUTO-APPROVAL FOR FREE PROGRAMS
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

DROP TRIGGER IF EXISTS trigger_auto_approve_free_enrollments ON enrollments;
CREATE TRIGGER trigger_auto_approve_free_enrollments
    BEFORE INSERT ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION auto_approve_free_program_enrollments();

-- ============================================================================
-- STEP 5: AUTO-PROMOTION FOR TOT GRADUATES
-- ============================================================================

CREATE OR REPLACE FUNCTION promote_tot_graduates_to_trainers()
RETURNS TRIGGER AS $$
DECLARE
    v_program_type VARCHAR(20);
    v_participant_user_id UUID;
BEGIN
    -- Only process when enrollment is completed
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
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
                AND role NOT IN ('admin', 'manager');
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_promote_tot_graduates ON enrollments;
CREATE TRIGGER trigger_promote_tot_graduates
    AFTER UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION promote_tot_graduates_to_trainers();

-- ============================================================================
-- STEP 6: REGISTRATION DATE VALIDATION
-- ============================================================================

CREATE OR REPLACE FUNCTION check_registration_dates()
RETURNS TRIGGER AS $$
DECLARE
    v_registration_type VARCHAR(20);
    v_reg_start_date DATE;
    v_reg_end_date DATE;
BEGIN
    -- Get registration info
    SELECT registration_type, registration_start_date, registration_end_date
    INTO v_registration_type, v_reg_start_date, v_reg_end_date
    FROM programs
    WHERE id = NEW.program_id;
    
    -- Only check dates if registration is limited
    IF v_registration_type = 'limited' THEN
        IF v_reg_start_date IS NOT NULL AND CURRENT_DATE < v_reg_start_date THEN
            RAISE EXCEPTION 'Pendaftaran belum dibuka. Pendaftaran dimulai pada %', v_reg_start_date;
        END IF;
        
        IF v_reg_end_date IS NOT NULL AND CURRENT_DATE > v_reg_end_date THEN
            RAISE EXCEPTION 'Pendaftaran sudah ditutup. Pendaftaran berakhir pada %', v_reg_end_date;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_registration_dates ON enrollments;
CREATE TRIGGER trigger_check_registration_dates
    BEFORE INSERT ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION check_registration_dates();

-- ============================================================================
-- STEP 7: RLS FOR CATEGORIES
-- ============================================================================

ALTER TABLE program_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view program categories" ON program_categories;
CREATE POLICY "Anyone can view program categories" ON program_categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin and Manager can manage categories" ON program_categories;
CREATE POLICY "Admin and Manager can manage categories" ON program_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✓ Program categories table created';
    RAISE NOTICE '✓ New columns added to programs table';
    RAISE NOTICE '✓ Auto-approval for free programs enabled';
    RAISE NOTICE '✓ TOT trainer promotion enabled';
    RAISE NOTICE '✓ Registration validation enabled';
    RAISE NOTICE '';
    RAISE NOTICE 'SUCCESS! You can now use the new program form.';
END $$;

