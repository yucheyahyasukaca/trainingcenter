-- ============================================================================
-- REFERRAL SYSTEM DATABASE SCHEMA
-- ============================================================================
-- Sistem referral lengkap dengan tracking, analytics, dan reward system

-- ============================================================================
-- STEP 1: CREATE REFERRAL CODES TABLE
-- ============================================================================

-- Tabel untuk menyimpan kode referral unik untuk setiap trainer
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trainer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL, -- Kode referral unik (contoh: TRN001, ABC123)
    description TEXT, -- Deskripsi kode referral (opsional)
    is_active BOOLEAN DEFAULT true,
    max_uses INTEGER, -- Maksimal penggunaan (NULL = unlimited)
    current_uses INTEGER DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0, -- Diskon untuk peserta yang menggunakan kode
    discount_amount DECIMAL(10,2) DEFAULT 0, -- Jumlah diskon tetap
    commission_percentage DECIMAL(5,2) DEFAULT 0, -- Komisi untuk trainer (persentase dari harga program)
    commission_amount DECIMAL(10,2) DEFAULT 0, -- Komisi tetap untuk trainer
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE, -- NULL = tidak ada batas waktu
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: CREATE REFERRAL TRACKING TABLE
-- ============================================================================

-- Tabel untuk tracking setiap penggunaan kode referral
CREATE TABLE IF NOT EXISTS referral_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    discount_applied DECIMAL(10,2) DEFAULT 0, -- Jumlah diskon yang diberikan
    commission_earned DECIMAL(10,2) DEFAULT 0, -- Komisi yang didapat trainer
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    -- Status: pending = baru daftar, confirmed = enrollment approved, cancelled = enrollment dibatalkan
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: CREATE REFERRAL REWARDS TABLE
-- ============================================================================

-- Tabel untuk menyimpan reward/komisi yang sudah dibayarkan ke trainer
CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trainer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    referral_tracking_id UUID NOT NULL REFERENCES referral_tracking(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
    payment_method VARCHAR(50), -- 'bank_transfer', 'cash', 'other'
    payment_reference TEXT, -- Nomor referensi pembayaran
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: ADD REFERRAL FIELDS TO ENROLLMENTS TABLE
-- ============================================================================

-- Tambahkan field referral ke tabel enrollments
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS referral_code_id UUID REFERENCES referral_codes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS referral_discount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_price DECIMAL(10,2) DEFAULT 0; -- Harga setelah diskon

-- ============================================================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes untuk referral_codes
CREATE INDEX IF NOT EXISTS idx_referral_codes_trainer_id ON referral_codes(trainer_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON referral_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_referral_codes_valid_dates ON referral_codes(valid_from, valid_until);

-- Indexes untuk referral_tracking
CREATE INDEX IF NOT EXISTS idx_referral_tracking_trainer_id ON referral_tracking(trainer_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_participant_id ON referral_tracking(participant_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_enrollment_id ON referral_tracking(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_program_id ON referral_tracking(program_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_status ON referral_tracking(status);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_created_at ON referral_tracking(created_at);

-- Indexes untuk referral_rewards
CREATE INDEX IF NOT EXISTS idx_referral_rewards_trainer_id ON referral_rewards(trainer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_payment_status ON referral_rewards(payment_status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_paid_at ON referral_rewards(paid_at);

-- Indexes untuk enrollments referral fields
CREATE INDEX IF NOT EXISTS idx_enrollments_referral_code_id ON enrollments(referral_code_id);

-- ============================================================================
-- STEP 6: CREATE FUNCTIONS
-- ============================================================================

-- Function untuk generate kode referral unik
CREATE OR REPLACE FUNCTION generate_referral_code(trainer_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_code TEXT;
    final_code TEXT;
    counter INTEGER := 1;
    exists_check BOOLEAN;
BEGIN
    -- Generate base code dari nama trainer (3 huruf pertama + 3 digit)
    base_code := UPPER(SUBSTRING(REPLACE(trainer_name, ' ', ''), 1, 3)) || LPAD(counter::TEXT, 3, '0');
    
    LOOP
        -- Check if code exists
        SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = base_code) INTO exists_check;
        
        IF NOT exists_check THEN
            final_code := base_code;
            EXIT;
        END IF;
        
        counter := counter + 1;
        base_code := UPPER(SUBSTRING(REPLACE(trainer_name, ' ', ''), 1, 3)) || LPAD(counter::TEXT, 3, '0');
        
        -- Safety check untuk mencegah infinite loop
        IF counter > 999 THEN
            final_code := 'REF' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
            EXIT;
        END IF;
    END LOOP;
    
    RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Function untuk create referral code untuk trainer
CREATE OR REPLACE FUNCTION create_trainer_referral_code(
    p_trainer_id UUID,
    p_description TEXT DEFAULT NULL,
    p_max_uses INTEGER DEFAULT NULL,
    p_discount_percentage DECIMAL(5,2) DEFAULT 0,
    p_discount_amount DECIMAL(10,2) DEFAULT 0,
    p_commission_percentage DECIMAL(5,2) DEFAULT 0,
    p_commission_amount DECIMAL(10,2) DEFAULT 0,
    p_valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    trainer_name TEXT;
    new_code TEXT;
    referral_code_id UUID;
BEGIN
    -- Get trainer name
    SELECT full_name INTO trainer_name
    FROM user_profiles
    WHERE id = p_trainer_id;
    
    IF trainer_name IS NULL THEN
        RAISE EXCEPTION 'Trainer not found';
    END IF;
    
    -- Generate unique code
    new_code := generate_referral_code(trainer_name);
    
    -- Insert referral code
    INSERT INTO referral_codes (
        trainer_id,
        code,
        description,
        max_uses,
        discount_percentage,
        discount_amount,
        commission_percentage,
        commission_amount,
        valid_until
    ) VALUES (
        p_trainer_id,
        new_code,
        p_description,
        p_max_uses,
        p_discount_percentage,
        p_discount_amount,
        p_commission_percentage,
        p_commission_amount,
        p_valid_until
    ) RETURNING id INTO referral_code_id;
    
    RETURN referral_code_id;
END;
$$ LANGUAGE plpgsql;

-- Function untuk apply referral code saat enrollment
CREATE OR REPLACE FUNCTION apply_referral_code(
    p_referral_code TEXT,
    p_program_id UUID,
    p_participant_id UUID
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    discount_amount DECIMAL(10,2),
    commission_amount DECIMAL(10,2),
    referral_code_id UUID
) AS $$
DECLARE
    ref_code_record RECORD;
    program_price DECIMAL(10,2);
    calculated_discount DECIMAL(10,2) := 0;
    calculated_commission DECIMAL(10,2) := 0;
BEGIN
    -- Get referral code details
    SELECT * INTO ref_code_record
    FROM referral_codes
    WHERE code = p_referral_code
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses);
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Referral code not found or expired', 0::DECIMAL(10,2), 0::DECIMAL(10,2), NULL::UUID;
        RETURN;
    END IF;
    
    -- Get program price
    SELECT price INTO program_price
    FROM programs
    WHERE id = p_program_id;
    
    -- Calculate discount
    IF ref_code_record.discount_percentage > 0 THEN
        calculated_discount := (program_price * ref_code_record.discount_percentage / 100);
    ELSIF ref_code_record.discount_amount > 0 THEN
        calculated_discount := ref_code_record.discount_amount;
    END IF;
    
    -- Calculate commission
    IF ref_code_record.commission_percentage > 0 THEN
        calculated_commission := (program_price * ref_code_record.commission_percentage / 100);
    ELSIF ref_code_record.commission_amount > 0 THEN
        calculated_commission := ref_code_record.commission_amount;
    END IF;
    
    -- Update current_uses
    UPDATE referral_codes
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE id = ref_code_record.id;
    
    RETURN QUERY SELECT 
        true, 
        'Referral code applied successfully', 
        calculated_discount,
        calculated_commission,
        ref_code_record.id;
END;
$$ LANGUAGE plpgsql;

-- Function untuk track referral saat enrollment
CREATE OR REPLACE FUNCTION track_referral_enrollment(
    p_referral_code_id UUID,
    p_enrollment_id UUID,
    p_discount_amount DECIMAL(10,2),
    p_commission_amount DECIMAL(10,2)
)
RETURNS UUID AS $$
DECLARE
    ref_code_record RECORD;
    enrollment_record RECORD;
    tracking_id UUID;
BEGIN
    -- Get referral code details
    SELECT * INTO ref_code_record
    FROM referral_codes
    WHERE id = p_referral_code_id;
    
    -- Get enrollment details
    SELECT * INTO enrollment_record
    FROM enrollments
    WHERE id = p_enrollment_id;
    
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
        p_referral_code_id,
        ref_code_record.trainer_id,
        enrollment_record.participant_id,
        p_enrollment_id,
        enrollment_record.program_id,
        enrollment_record.class_id,
        p_discount_amount,
        p_commission_amount,
        'pending'
    ) RETURNING id INTO tracking_id;
    
    RETURN tracking_id;
END;
$$ LANGUAGE plpgsql;

-- Function untuk update referral status saat enrollment status berubah
CREATE OR REPLACE FUNCTION update_referral_status(
    p_enrollment_id UUID,
    p_new_status VARCHAR(20)
)
RETURNS VOID AS $$
DECLARE
    ref_status VARCHAR(20);
BEGIN
    -- Map enrollment status to referral status
    ref_status := CASE 
        WHEN p_new_status = 'approved' THEN 'confirmed'
        WHEN p_new_status = 'rejected' OR p_new_status = 'cancelled' THEN 'cancelled'
        ELSE 'pending'
    END;
    
    -- Update referral tracking status
    UPDATE referral_tracking
    SET status = ref_status,
        updated_at = NOW()
    WHERE enrollment_id = p_enrollment_id;
    
    -- If confirmed, create reward record
    IF ref_status = 'confirmed' THEN
        INSERT INTO referral_rewards (
            trainer_id,
            referral_tracking_id,
            amount,
            payment_status
        )
        SELECT 
            rt.trainer_id,
            rt.id,
            rt.commission_earned,
            'pending'
        FROM referral_tracking rt
        WHERE rt.enrollment_id = p_enrollment_id
        AND rt.commission_earned > 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: CREATE TRIGGERS
-- ============================================================================

-- Trigger untuk update referral status saat enrollment status berubah
CREATE OR REPLACE FUNCTION trigger_update_referral_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if status changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM update_referral_status(NEW.id, NEW.status);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enrollment_status_change
    AFTER UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_referral_status();

-- ============================================================================
-- STEP 8: CREATE VIEWS FOR ANALYTICS
-- ============================================================================

-- View untuk referral statistics per trainer
CREATE OR REPLACE VIEW trainer_referral_stats AS
SELECT 
    up.id as trainer_id,
    up.full_name as trainer_name,
    up.email as trainer_email,
    COUNT(rt.id) as total_referrals,
    COUNT(CASE WHEN rt.status = 'confirmed' THEN 1 END) as confirmed_referrals,
    COUNT(CASE WHEN rt.status = 'pending' THEN 1 END) as pending_referrals,
    COUNT(CASE WHEN rt.status = 'cancelled' THEN 1 END) as cancelled_referrals,
    COALESCE(SUM(rt.commission_earned), 0) as total_commission_earned,
    COALESCE(SUM(CASE WHEN rt.status = 'confirmed' THEN rt.commission_earned ELSE 0 END), 0) as confirmed_commission,
    COALESCE(SUM(rt.discount_applied), 0) as total_discount_given,
    COUNT(DISTINCT rc.id) as total_referral_codes,
    COUNT(DISTINCT CASE WHEN rc.is_active = true THEN rc.id END) as active_referral_codes
FROM user_profiles up
LEFT JOIN referral_codes rc ON up.id = rc.trainer_id
LEFT JOIN referral_tracking rt ON rc.id = rt.referral_code_id
WHERE up.role = 'trainer'
GROUP BY up.id, up.full_name, up.email;

-- View untuk referral performance per program
CREATE OR REPLACE VIEW program_referral_stats AS
SELECT 
    p.id as program_id,
    p.title as program_title,
    p.price as program_price,
    COUNT(rt.id) as total_referrals,
    COUNT(CASE WHEN rt.status = 'confirmed' THEN 1 END) as confirmed_referrals,
    COALESCE(SUM(rt.discount_applied), 0) as total_discount_given,
    COALESCE(SUM(rt.commission_earned), 0) as total_commission_paid,
    COALESCE(AVG(rt.discount_applied), 0) as avg_discount_per_referral
FROM programs p
LEFT JOIN referral_tracking rt ON p.id = rt.program_id
GROUP BY p.id, p.title, p.price;

-- ============================================================================
-- STEP 9: ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all referral tables
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Policies for referral_codes
CREATE POLICY "Trainers can view their own referral codes" ON referral_codes
    FOR SELECT USING (trainer_id = auth.uid());

CREATE POLICY "Trainers can insert their own referral codes" ON referral_codes
    FOR INSERT WITH CHECK (trainer_id = auth.uid());

CREATE POLICY "Trainers can update their own referral codes" ON referral_codes
    FOR UPDATE USING (trainer_id = auth.uid());

-- Policies for referral_tracking
CREATE POLICY "Users can view referral tracking for their enrollments" ON referral_tracking
    FOR SELECT USING (
        participant_id IN (
            SELECT id FROM participants WHERE user_id = auth.uid()
        ) OR
        trainer_id = auth.uid()
    );

-- Policies for referral_rewards
CREATE POLICY "Trainers can view their own rewards" ON referral_rewards
    FOR SELECT USING (trainer_id = auth.uid());

-- ============================================================================
-- STEP 10: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION create_trainer_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION apply_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION track_referral_enrollment TO authenticated;
GRANT EXECUTE ON FUNCTION update_referral_status TO authenticated;

-- Grant select on views
GRANT SELECT ON trainer_referral_stats TO authenticated;
GRANT SELECT ON program_referral_stats TO authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Referral system database schema created successfully!';
    RAISE NOTICE 'Tables created: referral_codes, referral_tracking, referral_rewards';
    RAISE NOTICE 'Functions created: generate_referral_code, create_trainer_referral_code, apply_referral_code, track_referral_enrollment, update_referral_status';
    RAISE NOTICE 'Views created: trainer_referral_stats, program_referral_stats';
    RAISE NOTICE 'Triggers created: trigger_enrollment_status_change';
    RAISE NOTICE 'RLS policies enabled for security';
END $$;
