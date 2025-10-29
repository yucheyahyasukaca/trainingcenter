-- ============================================================================
-- CRITICAL FIX: AUTO-CREATE REFERRAL TRACKING ON ENROLLMENT
-- ============================================================================
-- This trigger automatically creates referral_tracking record when an enrollment
-- is created with a referral_code_id. This ensures 100% reliability that
-- referral tracking will always be created when a referral code is used.
-- ============================================================================

-- Function to auto-create referral_tracking when enrollment is created with referral_code_id
CREATE OR REPLACE FUNCTION auto_create_referral_tracking()
RETURNS TRIGGER AS $$
DECLARE
    ref_code_record RECORD;
    program_record RECORD;
    calculated_discount DECIMAL(10,2) := 0;
    calculated_commission DECIMAL(10,2) := 0;
    tracking_status VARCHAR(20) := 'pending';
BEGIN
    -- Only proceed if enrollment has referral_code_id
    IF NEW.referral_code_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Check if referral_tracking already exists for this enrollment
    -- (to prevent duplicates if trigger runs multiple times)
    IF EXISTS (SELECT 1 FROM referral_tracking WHERE enrollment_id = NEW.id) THEN
        RETURN NEW;
    END IF;

    -- Get referral code details
    SELECT * INTO ref_code_record
    FROM referral_codes
    WHERE id = NEW.referral_code_id;

    -- If referral code not found, log warning but don't fail
    IF NOT FOUND THEN
        RAISE WARNING 'Error creating referral_tracking for enrollment %: referral code % not found', NEW.id, NEW.referral_code_id;
        RETURN NEW;
    END IF;

    -- Get program details for calculating discount/commission
    SELECT * INTO program_record
    FROM programs
    WHERE id = NEW.program_id;

    -- Calculate discount based on referral code settings
    IF ref_code_record.discount_percentage > 0 AND program_record.price > 0 THEN
        calculated_discount := (program_record.price * ref_code_record.discount_percentage / 100);
    ELSIF ref_code_record.discount_amount > 0 THEN
        calculated_discount := ref_code_record.discount_amount;
    END IF;

    -- Ensure discount doesn't exceed program price
    IF calculated_discount > program_record.price THEN
        calculated_discount := program_record.price;
    END IF;

    -- Calculate commission based on referral code settings
    IF ref_code_record.commission_percentage > 0 AND program_record.price > 0 THEN
        calculated_commission := (program_record.price * ref_code_record.commission_percentage / 100);
    ELSIF ref_code_record.commission_amount > 0 THEN
        calculated_commission := ref_code_record.commission_amount;
    END IF;

    -- Set status based on enrollment status
    -- If enrollment is already approved, referral should be confirmed
    IF NEW.status = 'approved' THEN
        tracking_status := 'confirmed';
    ELSIF NEW.status IN ('rejected', 'cancelled') THEN
        tracking_status := 'cancelled';
    ELSE
        tracking_status := 'pending';
    END IF;

    -- Create referral_tracking record
    INSERT INTO referral_tracking (
        referral_code_id,
        trainer_id,
        participant_id,
        enrollment_id,
        program_id,
        class_id,
        discount_applied,
        commission_earned,
        status,
        created_at,
        updated_at
    ) VALUES (
        NEW.referral_code_id,
        ref_code_record.trainer_id,
        NEW.participant_id,
        NEW.id,
        NEW.program_id,
        NEW.class_id,
        calculated_discount,
        calculated_commission,
        tracking_status,
        NOW(),
        NOW()
    );

    -- Update referral code current_uses counter
    UPDATE referral_codes
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE id = NEW.referral_code_id
    AND (max_uses IS NULL OR current_uses < max_uses);

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the enrollment insertion
        RAISE WARNING 'Error auto-creating referral_tracking for enrollment %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists (to avoid duplicates)
DROP TRIGGER IF EXISTS trigger_auto_create_referral_tracking ON enrollments;

-- Create trigger that fires AFTER INSERT on enrollments
CREATE TRIGGER trigger_auto_create_referral_tracking
    AFTER INSERT ON enrollments
    FOR EACH ROW
    WHEN (NEW.referral_code_id IS NOT NULL)
    EXECUTE FUNCTION auto_create_referral_tracking();

-- ============================================================================
-- Also handle UPDATE case: if referral_code_id is added to existing enrollment
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_create_referral_tracking_on_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if referral_code_id was added (was NULL, now has value)
    IF OLD.referral_code_id IS NULL AND NEW.referral_code_id IS NOT NULL THEN
        -- Check if tracking already exists
        IF NOT EXISTS (SELECT 1 FROM referral_tracking WHERE enrollment_id = NEW.id) THEN
            -- Call the main function logic
            PERFORM auto_create_referral_tracking_on_insert(NEW);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function for UPDATE trigger (reuse logic from INSERT)
CREATE OR REPLACE FUNCTION auto_create_referral_tracking_on_insert(enrollment_record RECORD)
RETURNS VOID AS $$
DECLARE
    ref_code_record RECORD;
    program_record RECORD;
    calculated_discount DECIMAL(10,2) := 0;
    calculated_commission DECIMAL(10,2) := 0;
    tracking_status VARCHAR(20) := 'pending';
BEGIN
    -- Get referral code details
    SELECT * INTO ref_code_record
    FROM referral_codes
    WHERE id = enrollment_record.referral_code_id;

    IF NOT FOUND THEN
        RAISE WARNING 'Referral code % not found for enrollment %', enrollment_record.referral_code_id, enrollment_record.id;
        RETURN;
    END IF;

    -- Get program details
    SELECT * INTO program_record
    FROM programs
    WHERE id = enrollment_record.program_id;

    -- Calculate discount
    IF ref_code_record.discount_percentage > 0 AND program_record.price > 0 THEN
        calculated_discount := (program_record.price * ref_code_record.discount_percentage / 100);
    ELSIF ref_code_record.discount_amount > 0 THEN
        calculated_discount := ref_code_record.discount_amount;
    END IF;

    IF calculated_discount > program_record.price THEN
        calculated_discount := program_record.price;
    END IF;

    -- Calculate commission
    IF ref_code_record.commission_percentage > 0 AND program_record.price > 0 THEN
        calculated_commission := (program_record.price * ref_code_record.commission_percentage / 100);
    ELSIF ref_code_record.commission_amount > 0 THEN
        calculated_commission := ref_code_record.commission_amount;
    END IF;

    -- Set status
    IF enrollment_record.status = 'approved' THEN
        tracking_status := 'confirmed';
    ELSIF enrollment_record.status IN ('rejected', 'cancelled') THEN
        tracking_status := 'cancelled';
    ELSE
        tracking_status := 'pending';
    END IF;

    -- Create tracking
    INSERT INTO referral_tracking (
        referral_code_id,
        trainer_id,
        participant_id,
        enrollment_id,
        program_id,
        class_id,
        discount_applied,
        commission_earned,
        status,
        created_at,
        updated_at
    ) VALUES (
        enrollment_record.referral_code_id,
        ref_code_record.trainer_id,
        enrollment_record.participant_id,
        enrollment_record.id,
        enrollment_record.program_id,
        enrollment_record.class_id,
        calculated_discount,
        calculated_commission,
        tracking_status,
        NOW(),
        NOW()
    );

    -- Update referral code counter
    UPDATE referral_codes
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE id = enrollment_record.referral_code_id
    AND (max_uses IS NULL OR current_uses < max_uses);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for UPDATE
DROP TRIGGER IF EXISTS trigger_auto_create_referral_tracking_on_update ON enrollments;

CREATE TRIGGER trigger_auto_create_referral_tracking_on_update
    AFTER UPDATE ON enrollments
    FOR EACH ROW
    WHEN (OLD.referral_code_id IS NULL AND NEW.referral_code_id IS NOT NULL)
    EXECUTE FUNCTION auto_create_referral_tracking_on_update();

-- ============================================================================
-- Grant necessary permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION auto_create_referral_tracking() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_create_referral_tracking_on_update() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_create_referral_tracking_on_insert(RECORD) TO authenticated;

-- ============================================================================
-- Verify trigger creation
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Auto-create referral tracking trigger created successfully!';
    RAISE NOTICE '   • Trigger fires on INSERT when referral_code_id is present';
    RAISE NOTICE '   • Trigger fires on UPDATE when referral_code_id is added';
    RAISE NOTICE '   • Automatically calculates discount and commission';
    RAISE NOTICE '   • Updates referral code usage counter';
END $$;
