-- Ensure Referral Tables Exist
-- Script ini untuk memastikan semua tabel referral ada

-- Check if referral_codes table exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_codes') THEN
        CREATE TABLE referral_codes (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            trainer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
            code VARCHAR(20) UNIQUE NOT NULL,
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
        RAISE NOTICE 'referral_codes table created';
    ELSE
        RAISE NOTICE 'referral_codes table already exists';
    END IF;
END $$;

-- Check if referral_tracking table exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_tracking') THEN
        CREATE TABLE referral_tracking (
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
        RAISE NOTICE 'referral_tracking table created';
    ELSE
        RAISE NOTICE 'referral_tracking table already exists';
    END IF;
END $$;

-- Check if referral_rewards table exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_rewards') THEN
        CREATE TABLE referral_rewards (
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
        RAISE NOTICE 'referral_rewards table created';
    ELSE
        RAISE NOTICE 'referral_rewards table already exists';
    END IF;
END $$;

-- Add referral fields to enrollments table if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'referral_code_id') THEN
        ALTER TABLE enrollments ADD COLUMN referral_code_id UUID REFERENCES referral_codes(id) ON DELETE SET NULL;
        RAISE NOTICE 'referral_code_id column added to enrollments';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'referral_discount') THEN
        ALTER TABLE enrollments ADD COLUMN referral_discount DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'referral_discount column added to enrollments';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'final_price') THEN
        ALTER TABLE enrollments ADD COLUMN final_price DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'final_price column added to enrollments';
    END IF;
END $$;

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_referral_codes_trainer_id ON referral_codes(trainer_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_trainer_id ON referral_tracking(trainer_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_enrollment_id ON referral_tracking(enrollment_id);

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
DO $$
BEGIN
    -- referral_codes policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_codes' AND policyname = 'Trainers can view their own referral codes') THEN
        CREATE POLICY "Trainers can view their own referral codes" ON referral_codes
            FOR SELECT USING (trainer_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_codes' AND policyname = 'Trainers can insert their own referral codes') THEN
        CREATE POLICY "Trainers can insert their own referral codes" ON referral_codes
            FOR INSERT WITH CHECK (trainer_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_codes' AND policyname = 'Trainers can update their own referral codes') THEN
        CREATE POLICY "Trainers can update their own referral codes" ON referral_codes
            FOR UPDATE USING (trainer_id = auth.uid());
    END IF;
    
    -- referral_tracking policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_tracking' AND policyname = 'Users can view referral tracking for their enrollments') THEN
        CREATE POLICY "Users can view referral tracking for their enrollments" ON referral_tracking
            FOR SELECT USING (
                participant_id IN (
                    SELECT id FROM participants WHERE user_id = auth.uid()
                ) OR
                trainer_id = auth.uid()
            );
    END IF;
    
    -- referral_rewards policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_rewards' AND policyname = 'Trainers can view their own rewards') THEN
        CREATE POLICY "Trainers can view their own rewards" ON referral_rewards
            FOR SELECT USING (trainer_id = auth.uid());
    END IF;
END $$;

-- Create basic functions if not exist
DO $$
BEGIN
    -- generate_referral_code function
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'generate_referral_code') THEN
        CREATE OR REPLACE FUNCTION generate_referral_code(trainer_name TEXT)
        RETURNS TEXT AS $$
        DECLARE
            base_code TEXT;
            final_code TEXT;
            counter INTEGER := 1;
            exists_check BOOLEAN;
        BEGIN
            base_code := UPPER(SUBSTRING(REPLACE(trainer_name, ' ', ''), 1, 3)) || LPAD(counter::TEXT, 3, '0');
            
            LOOP
                SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = base_code) INTO exists_check;
                
                IF NOT exists_check THEN
                    final_code := base_code;
                    EXIT;
                END IF;
                
                counter := counter + 1;
                base_code := UPPER(SUBSTRING(REPLACE(trainer_name, ' ', ''), 1, 3)) || LPAD(counter::TEXT, 3, '0');
                
                IF counter > 999 THEN
                    final_code := 'REF' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
                    EXIT;
                END IF;
            END LOOP;
            
            RETURN final_code;
        END;
        $$ LANGUAGE plpgsql;
        RAISE NOTICE 'generate_referral_code function created';
    END IF;
    
    -- create_trainer_referral_code function
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_trainer_referral_code') THEN
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
            SELECT full_name INTO trainer_name
            FROM user_profiles
            WHERE id = p_trainer_id;
            
            IF trainer_name IS NULL THEN
                RAISE EXCEPTION 'Trainer not found';
            END IF;
            
            new_code := generate_referral_code(trainer_name);
            
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
        RAISE NOTICE 'create_trainer_referral_code function created';
    END IF;
END $$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION create_trainer_referral_code TO authenticated;

-- Create views
\i fix-referral-views.sql

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Referral system tables and functions ensured successfully!';
    RAISE NOTICE '📊 Tables checked/created:';
    RAISE NOTICE '   • referral_codes';
    RAISE NOTICE '   • referral_tracking';
    RAISE NOTICE '   • referral_rewards';
    RAISE NOTICE '   • enrollments (updated with referral fields)';
    RAISE NOTICE '📋 Functions checked/created:';
    RAISE NOTICE '   • generate_referral_code';
    RAISE NOTICE '   • create_trainer_referral_code';
    RAISE NOTICE '🎯 Views created:';
    RAISE NOTICE '   • trainer_referral_stats';
    RAISE NOTICE '   • program_referral_stats';
END $$;
