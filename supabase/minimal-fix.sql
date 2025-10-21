-- ============================================================================
-- MINIMAL FIX - Hanya tambah kolom yang benar-benar diperlukan
-- ============================================================================

-- 1. Buat tabel categories (jika belum ada)
CREATE TABLE IF NOT EXISTS program_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert default categories (jika belum ada)
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

-- 3. Tambah kolom ke programs (satu per satu)
ALTER TABLE programs ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) DEFAULT 'regular';
ALTER TABLE programs ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS registration_type VARCHAR(20) DEFAULT 'lifetime';
ALTER TABLE programs ADD COLUMN IF NOT EXISTS registration_start_date DATE;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS registration_end_date DATE;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT false;

-- 4. Update data existing
UPDATE programs 
SET 
    program_type = COALESCE(program_type, 'regular'),
    is_free = COALESCE(is_free, (price = 0 OR price IS NULL)),
    registration_type = COALESCE(registration_type, 'lifetime'),
    auto_approved = COALESCE(auto_approved, (price = 0 OR price IS NULL))
WHERE program_type IS NULL;

-- 5. RLS untuk categories
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

-- 6. Function untuk auto-approval
CREATE OR REPLACE FUNCTION auto_approve_free_program_enrollments()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM programs 
        WHERE id = NEW.program_id 
        AND is_free = true
    ) THEN
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

-- 7. Function untuk TOT promotion
CREATE OR REPLACE FUNCTION promote_tot_graduates_to_trainers()
RETURNS TRIGGER AS $$
DECLARE
    v_program_type VARCHAR(20);
    v_participant_user_id UUID;
BEGIN
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
        SELECT program_type INTO v_program_type
        FROM programs
        WHERE id = NEW.program_id;
        
        IF v_program_type = 'tot' THEN
            SELECT user_id INTO v_participant_user_id
            FROM participants
            WHERE id = NEW.participant_id;
            
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

-- 8. Function untuk validasi tanggal
CREATE OR REPLACE FUNCTION check_registration_dates()
RETURNS TRIGGER AS $$
DECLARE
    v_registration_type VARCHAR(20);
    v_reg_start_date DATE;
    v_reg_end_date DATE;
BEGIN
    SELECT registration_type, registration_start_date, registration_end_date
    INTO v_registration_type, v_reg_start_date, v_reg_end_date
    FROM programs
    WHERE id = NEW.program_id;
    
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

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✓ Minimal fix applied successfully!';
    RAISE NOTICE '✓ Program form should work now.';
END $$;
