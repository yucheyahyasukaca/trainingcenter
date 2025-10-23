-- Fix referral_codes table structure
-- Run this script in Supabase SQL Editor

-- First, let's check the current structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'referral_codes' 
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add discount_percentage column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_codes' 
        AND column_name = 'discount_percentage'
    ) THEN
        ALTER TABLE referral_codes ADD COLUMN discount_percentage DECIMAL(5,2);
    END IF;

    -- Add discount_amount column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_codes' 
        AND column_name = 'discount_amount'
    ) THEN
        ALTER TABLE referral_codes ADD COLUMN discount_amount DECIMAL(10,2);
    END IF;

    -- Add commission_percentage column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_codes' 
        AND column_name = 'commission_percentage'
    ) THEN
        ALTER TABLE referral_codes ADD COLUMN commission_percentage DECIMAL(5,2);
    END IF;

    -- Add commission_amount column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_codes' 
        AND column_name = 'commission_amount'
    ) THEN
        ALTER TABLE referral_codes ADD COLUMN commission_amount DECIMAL(10,2);
    END IF;

    -- Add is_active column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_codes' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE referral_codes ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Add valid_until column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_codes' 
        AND column_name = 'valid_until'
    ) THEN
        ALTER TABLE referral_codes ADD COLUMN valid_until TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add max_uses column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_codes' 
        AND column_name = 'max_uses'
    ) THEN
        ALTER TABLE referral_codes ADD COLUMN max_uses INTEGER;
    END IF;

    -- Add description column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_codes' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE referral_codes ADD COLUMN description TEXT;
    END IF;
END $$;

-- Set default values for existing records
UPDATE referral_codes 
SET 
    discount_percentage = 0,
    discount_amount = 0,
    commission_percentage = 0,
    commission_amount = 0,
    is_active = true
WHERE 
    discount_percentage IS NULL 
    OR discount_amount IS NULL 
    OR commission_percentage IS NULL 
    OR commission_amount IS NULL 
    OR is_active IS NULL;

-- Add constraints
ALTER TABLE referral_codes 
ALTER COLUMN discount_percentage SET DEFAULT 0,
ALTER COLUMN discount_amount SET DEFAULT 0,
ALTER COLUMN commission_percentage SET DEFAULT 0,
ALTER COLUMN commission_amount SET DEFAULT 0,
ALTER COLUMN is_active SET DEFAULT true;

-- Add check constraints for positive values
ALTER TABLE referral_codes 
ADD CONSTRAINT check_discount_percentage 
CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

ALTER TABLE referral_codes 
ADD CONSTRAINT check_discount_amount 
CHECK (discount_amount >= 0);

ALTER TABLE referral_codes 
ADD CONSTRAINT check_commission_percentage 
CHECK (commission_percentage >= 0 AND commission_percentage <= 100);

ALTER TABLE referral_codes 
ADD CONSTRAINT check_commission_amount 
CHECK (commission_amount >= 0);

-- Verify the final structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'referral_codes' 
ORDER BY ordinal_position;

-- Test insert to make sure everything works (using existing trainer)
DO $$
DECLARE
    test_trainer_id UUID;
BEGIN
    -- Get first available trainer
    SELECT id INTO test_trainer_id 
    FROM user_profiles 
    WHERE role = 'trainer' 
    LIMIT 1;
    
    -- Only test if trainer exists
    IF test_trainer_id IS NOT NULL THEN
        INSERT INTO referral_codes (
            trainer_id, 
            code, 
            description, 
            max_uses, 
            discount_percentage, 
            discount_amount, 
            commission_percentage, 
            commission_amount, 
            valid_until, 
            is_active
        ) VALUES (
            test_trainer_id,
            'TEST123',
            'Test referral code',
            10,
            5.00,
            1000.00,
            10.00,
            500.00,
            NOW() + INTERVAL '30 days',
            true
        ) ON CONFLICT (code) DO NOTHING;
        
        -- Clean up test data
        DELETE FROM referral_codes WHERE code = 'TEST123';
        
        RAISE NOTICE 'Test insert successful!';
    ELSE
        RAISE NOTICE 'No trainers found, skipping test insert.';
    END IF;
END $$;

-- Show success message
SELECT 'Referral codes table structure updated successfully!' as message;
