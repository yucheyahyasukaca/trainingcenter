-- ============================================================================
-- REFERRAL POLICY SYSTEM - IMPROVED VERSION
-- ============================================================================
-- Sistem referral yang lebih terkontrol dengan policy yang ditentukan admin

-- ============================================================================
-- STEP 1: CREATE REFERRAL POLICIES TABLE
-- ============================================================================

-- Tabel untuk menyimpan policy referral per program
CREATE TABLE IF NOT EXISTS referral_policies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    
    -- Policy untuk peserta (diskon)
    participant_discount_percentage DECIMAL(5,2) DEFAULT 0,
    participant_discount_amount DECIMAL(10,2) DEFAULT 0,
    participant_discount_type VARCHAR(20) DEFAULT 'percentage' CHECK (participant_discount_type IN ('percentage', 'amount')),
    
    -- Policy untuk referrer (komisi)
    referrer_commission_percentage DECIMAL(5,2) DEFAULT 0,
    referrer_commission_amount DECIMAL(10,2) DEFAULT 0,
    referrer_commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (referrer_commission_type IN ('percentage', 'amount')),
    
    -- Batasan penggunaan
    max_uses_per_code INTEGER DEFAULT NULL, -- NULL = unlimited
    max_total_uses INTEGER DEFAULT NULL, -- NULL = unlimited
    
    -- Validitas
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: UPDATE REFERRAL CODES TABLE
-- ============================================================================

-- Hapus kolom diskon dan komisi dari referral_codes
-- Karena sekarang policy ditentukan di referral_policies
ALTER TABLE referral_codes 
DROP COLUMN IF EXISTS discount_percentage,
DROP COLUMN IF EXISTS discount_amount,
DROP COLUMN IF EXISTS commission_percentage,
DROP COLUMN IF EXISTS commission_amount;

-- Tambah kolom untuk policy
ALTER TABLE referral_codes 
ADD COLUMN IF NOT EXISTS policy_id UUID REFERENCES referral_policies(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 3: CREATE FUNCTIONS
-- ============================================================================

-- Function untuk membuat policy referral
CREATE OR REPLACE FUNCTION create_referral_policy(
    p_program_id UUID,
    p_created_by UUID,
    p_participant_discount_percentage DECIMAL(5,2) DEFAULT 0,
    p_participant_discount_amount DECIMAL(10,2) DEFAULT 0,
    p_participant_discount_type VARCHAR(20) DEFAULT 'percentage',
    p_referrer_commission_percentage DECIMAL(5,2) DEFAULT 0,
    p_referrer_commission_amount DECIMAL(10,2) DEFAULT 0,
    p_referrer_commission_type VARCHAR(20) DEFAULT 'percentage',
    p_max_uses_per_code INTEGER DEFAULT NULL,
    p_max_total_uses INTEGER DEFAULT NULL,
    p_valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    policy_id UUID;
BEGIN
    -- Insert policy
    INSERT INTO referral_policies (
        program_id,
        participant_discount_percentage,
        participant_discount_amount,
        participant_discount_type,
        referrer_commission_percentage,
        referrer_commission_amount,
        referrer_commission_type,
        max_uses_per_code,
        max_total_uses,
        valid_until,
        created_by
    ) VALUES (
        p_program_id,
        p_participant_discount_percentage,
        p_participant_discount_amount,
        p_participant_discount_type,
        p_referrer_commission_percentage,
        p_referrer_commission_amount,
        p_referrer_commission_type,
        p_max_uses_per_code,
        p_max_total_uses,
        p_valid_until,
        p_created_by
    ) RETURNING id INTO policy_id;
    
    RETURN policy_id;
END;
$$ LANGUAGE plpgsql;

-- Function untuk membuat kode referral dengan policy
CREATE OR REPLACE FUNCTION create_referral_code_with_policy(
    p_trainer_id UUID,
    p_trainer_name VARCHAR(255),
    p_program_id UUID,
    p_description TEXT DEFAULT NULL,
    p_max_uses INTEGER DEFAULT NULL,
    p_valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS TABLE(
    id UUID,
    code VARCHAR(20),
    message TEXT
) AS $$
DECLARE
    policy_id UUID;
    referral_code_id UUID;
    generated_code VARCHAR(20);
    policy_exists BOOLEAN;
BEGIN
    -- Cek apakah ada policy untuk program ini
    SELECT id INTO policy_id
    FROM referral_policies
    WHERE program_id = p_program_id 
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > NOW())
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF policy_id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR(20), 'Tidak ada policy referral untuk program ini'::TEXT;
        RETURN;
    END IF;
    
    -- Generate kode referral
    generated_code := 'REF' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 10, '0') || SUBSTRING(MD5(RANDOM()::TEXT), 1, 3);
    
    -- Insert referral code
    INSERT INTO referral_codes (
        trainer_id,
        code,
        description,
        is_active,
        max_uses,
        valid_until,
        policy_id
    ) VALUES (
        p_trainer_id,
        generated_code,
        p_description,
        true,
        p_max_uses,
        p_valid_until,
        policy_id
    ) RETURNING id INTO referral_code_id;
    
    RETURN QUERY SELECT referral_code_id, generated_code, 'Kode referral berhasil dibuat'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function untuk apply referral code dengan policy
CREATE OR REPLACE FUNCTION apply_referral_code_with_policy(
    p_referral_code VARCHAR(20),
    p_program_id UUID,
    p_participant_id UUID,
    p_enrollment_id UUID,
    p_class_id UUID DEFAULT NULL
) RETURNS TABLE(
    success BOOLEAN,
    discount_amount DECIMAL(10,2),
    commission_amount DECIMAL(10,2),
    message TEXT
) AS $$
DECLARE
    code_record RECORD;
    policy_record RECORD;
    program_record RECORD;
    discount_calc DECIMAL(10,2) := 0;
    commission_calc DECIMAL(10,2) := 0;
    tracking_id UUID;
BEGIN
    -- Get referral code info
    SELECT rc.*, up.full_name as trainer_name
    INTO code_record
    FROM referral_codes rc
    JOIN user_profiles up ON rc.trainer_id = up.id
    WHERE rc.code = p_referral_code 
    AND rc.is_active = true
    AND (rc.valid_until IS NULL OR rc.valid_until > NOW());
    
    IF code_record IS NULL THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10,2), 0::DECIMAL(10,2), 'Kode referral tidak valid'::TEXT;
        RETURN;
    END IF;
    
    -- Get policy info
    SELECT *
    INTO policy_record
    FROM referral_policies
    WHERE id = code_record.policy_id
    AND is_active = true;
    
    IF policy_record IS NULL THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10,2), 0::DECIMAL(10,2), 'Policy referral tidak ditemukan'::TEXT;
        RETURN;
    END IF;
    
    -- Get program info
    SELECT price
    INTO program_record
    FROM programs
    WHERE id = p_program_id;
    
    IF program_record IS NULL THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10,2), 0::DECIMAL(10,2), 'Program tidak ditemukan'::TEXT;
        RETURN;
    END IF;
    
    -- Calculate discount
    IF policy_record.participant_discount_type = 'percentage' THEN
        discount_calc := (program_record.price * policy_record.participant_discount_percentage) / 100;
    ELSE
        discount_calc := policy_record.participant_discount_amount;
    END IF;
    
    -- Calculate commission
    IF policy_record.referrer_commission_type = 'percentage' THEN
        commission_calc := (program_record.price * policy_record.referrer_commission_percentage) / 100;
    ELSE
        commission_calc := policy_record.referrer_commission_amount;
    END IF;
    
    -- Insert tracking record
    INSERT INTO referral_tracking (
        referral_code_id,
        trainer_id,
        participant_id,
        enrollment_id,
        program_id,
        class_id,
        discount_applied,
        commission_earned,
        status
    ) VALUES (
        code_record.id,
        code_record.trainer_id,
        p_participant_id,
        p_enrollment_id,
        p_program_id,
        p_class_id,
        discount_calc,
        commission_calc,
        'pending'
    ) RETURNING id INTO tracking_id;
    
    -- Update current uses
    UPDATE referral_codes 
    SET current_uses = current_uses + 1
    WHERE id = code_record.id;
    
    RETURN QUERY SELECT true, discount_calc, commission_calc, 'Kode referral berhasil diterapkan'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: CREATE VIEWS
-- ============================================================================

-- View untuk melihat policy dan kode referral
CREATE OR REPLACE VIEW referral_policy_overview AS
SELECT 
    rp.id as policy_id,
    p.title as program_title,
    p.price as program_price,
    rp.participant_discount_percentage,
    rp.participant_discount_amount,
    rp.participant_discount_type,
    rp.referrer_commission_percentage,
    rp.referrer_commission_amount,
    rp.referrer_commission_type,
    rp.max_uses_per_code,
    rp.max_total_uses,
    rp.valid_from,
    rp.valid_until,
    rp.is_active,
    up.full_name as created_by_name,
    COUNT(rc.id) as total_codes,
    COUNT(CASE WHEN rc.is_active = true THEN 1 END) as active_codes
FROM referral_policies rp
JOIN programs p ON rp.program_id = p.id
JOIN user_profiles up ON rp.created_by = up.id
LEFT JOIN referral_codes rc ON rp.id = rc.policy_id
GROUP BY rp.id, p.title, p.price, up.full_name;

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE referral_policies ENABLE ROW LEVEL SECURITY;

-- Policy untuk admin bisa CRUD semua policy
CREATE POLICY "Admin can manage all referral policies" ON referral_policies
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy untuk trainer bisa lihat policy program mereka
CREATE POLICY "Trainers can view policies for their programs" ON referral_policies
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM programs p
        JOIN user_profiles up ON p.trainer_id = up.id
        WHERE p.id = referral_policies.program_id 
        AND up.id = auth.uid()
    )
);

-- ============================================================================
-- STEP 6: INSERT SAMPLE DATA
-- ============================================================================

-- Sample policy untuk program (admin set)
-- INSERT INTO referral_policies (
--     program_id,
--     participant_discount_percentage,
--     participant_discount_type,
--     referrer_commission_percentage,
--     referrer_commission_type,
--     max_uses_per_code,
--     created_by
-- ) VALUES (
--     'program-id-here',
--     10, -- 10% diskon untuk peserta
--     'percentage',
--     5,  -- 5% komisi untuk referrer
--     'percentage',
--     100, -- Max 100 penggunaan per kode
--     'admin-user-id-here'
-- );
