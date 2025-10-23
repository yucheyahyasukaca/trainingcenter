-- ============================================================================
-- FIX REFERRAL TABLES - ENSURE ALL REQUIRED TABLES EXIST
-- ============================================================================
-- Script ini memastikan semua tabel referral yang diperlukan ada di database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 1: CREATE REFERRAL_CODES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trainer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    commission_percentage DECIMAL(5,2) DEFAULT 0,
    commission_amount DECIMAL(10,2) DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: CREATE REFERRAL_TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    discount_applied DECIMAL(10,2) DEFAULT 0,
    commission_earned DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: CREATE REFERRAL_REWARDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trainer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    referral_tracking_id UUID NOT NULL REFERENCES referral_tracking(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
    payment_method VARCHAR(50),
    payment_reference TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: ADD REFERRAL FIELDS TO ENROLLMENTS TABLE
-- ============================================================================

-- Tambahkan field referral ke tabel enrollments jika belum ada
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS referral_code_id UUID REFERENCES referral_codes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS referral_discount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_price DECIMAL(10,2) DEFAULT 0;

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

-- ============================================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on referral tables
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: CREATE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Trainers can view their own referral codes" ON referral_codes;
DROP POLICY IF EXISTS "Trainers can insert their own referral codes" ON referral_codes;
DROP POLICY IF EXISTS "Trainers can update their own referral codes" ON referral_codes;
DROP POLICY IF EXISTS "Trainers can delete their own referral codes" ON referral_codes;
DROP POLICY IF EXISTS "Admins and managers can manage all referral codes" ON referral_codes;

-- Policy for SELECT (view referral codes)
CREATE POLICY "Trainers can view their own referral codes" ON referral_codes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'trainer'
    AND referral_codes.trainer_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Policy for INSERT (create referral codes)
CREATE POLICY "Trainers can insert their own referral codes" ON referral_codes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'trainer'
    AND referral_codes.trainer_id = auth.uid()
  )
);

-- Policy for UPDATE (update referral codes)
CREATE POLICY "Trainers can update their own referral codes" ON referral_codes
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'trainer'
    AND referral_codes.trainer_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Policy for DELETE (delete referral codes)
CREATE POLICY "Trainers can delete their own referral codes" ON referral_codes
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'trainer'
    AND referral_codes.trainer_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Policies for referral_tracking
DROP POLICY IF EXISTS "Trainers can view their own referral tracking" ON referral_tracking;
CREATE POLICY "Trainers can view their own referral tracking" ON referral_tracking
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'trainer'
    AND referral_tracking.trainer_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Policies for referral_rewards
DROP POLICY IF EXISTS "Trainers can view their own referral rewards" ON referral_rewards;
CREATE POLICY "Trainers can view their own referral rewards" ON referral_rewards
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'trainer'
    AND referral_rewards.trainer_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- ============================================================================
-- STEP 8: GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON referral_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON referral_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON referral_rewards TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Referral tables created/updated successfully!';
    RAISE NOTICE '📊 Tables: referral_codes, referral_tracking, referral_rewards';
    RAISE NOTICE '🔒 RLS policies enabled for security';
    RAISE NOTICE '📈 Indexes created for performance';
    RAISE NOTICE '🎯 Ready for referral system!';
END $$;
