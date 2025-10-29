-- ============================================================================
-- FIX EXISTING ENROLLMENTS: Create referral_tracking for enrollments that
-- have referral_code_id but no referral_tracking record
-- ============================================================================
-- This script creates referral_tracking records for existing enrollments
-- that have referral_code_id but were created before the auto-trigger was set up
-- ============================================================================

DO $$
DECLARE
    enrollment_rec RECORD;
    ref_code_rec RECORD;
    program_rec RECORD;
    calculated_discount DECIMAL(10,2) := 0;
    calculated_commission DECIMAL(10,2) := 0;
    tracking_status VARCHAR(20) := 'pending';
    tracking_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting to fix existing enrollments with referral codes...';

    -- Loop through all enrollments with referral_code_id but no tracking
    FOR enrollment_rec IN
        SELECT e.*
        FROM enrollments e
        WHERE e.referral_code_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM referral_tracking rt
            WHERE rt.enrollment_id = e.id
        )
    LOOP
        BEGIN
            -- Get referral code details
            SELECT * INTO ref_code_rec
            FROM referral_codes
            WHERE id = enrollment_rec.referral_code_id;

            -- Skip if referral code not found
            IF NOT FOUND THEN
                RAISE WARNING 'Referral code % not found for enrollment %', enrollment_rec.referral_code_id, enrollment_rec.id;
                error_count := error_count + 1;
                CONTINUE;
            END IF;

            -- Get program details
            SELECT * INTO program_rec
            FROM programs
            WHERE id = enrollment_rec.program_id;

            -- Skip if program not found
            IF NOT FOUND THEN
                RAISE WARNING 'Program % not found for enrollment %', enrollment_rec.program_id, enrollment_rec.id;
                error_count := error_count + 1;
                CONTINUE;
            END IF;

            -- Calculate discount
            IF ref_code_rec.discount_percentage > 0 AND program_rec.price > 0 THEN
                calculated_discount := (program_rec.price * ref_code_rec.discount_percentage / 100);
            ELSIF ref_code_rec.discount_amount > 0 THEN
                calculated_discount := ref_code_rec.discount_amount;
            ELSE
                -- Try to extract from enrollment notes or referral_discount field
                IF enrollment_rec.referral_discount IS NOT NULL THEN
                    calculated_discount := enrollment_rec.referral_discount;
                END IF;
            END IF;

            IF calculated_discount > program_rec.price THEN
                calculated_discount := program_rec.price;
            END IF;

            -- Calculate commission
            IF ref_code_rec.commission_percentage > 0 AND program_rec.price > 0 THEN
                calculated_commission := (program_rec.price * ref_code_rec.commission_percentage / 100);
            ELSIF ref_code_rec.commission_amount > 0 THEN
                calculated_commission := ref_code_rec.commission_amount;
            END IF;

            -- Set status based on enrollment status
            IF enrollment_rec.status = 'approved' THEN
                tracking_status := 'confirmed';
            ELSIF enrollment_rec.status IN ('rejected', 'cancelled') THEN
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
                enrollment_rec.referral_code_id,
                ref_code_rec.trainer_id,
                enrollment_rec.participant_id,
                enrollment_rec.id,
                enrollment_rec.program_id,
                enrollment_rec.class_id,
                calculated_discount,
                calculated_commission,
                tracking_status,
                enrollment_rec.created_at, -- Use enrollment created_at to maintain timeline
                NOW()
            );

            tracking_count := tracking_count + 1;

            -- Update referral code usage counter (only if not already at max)
            UPDATE referral_codes
            SET current_uses = current_uses + 1,
                updated_at = NOW()
            WHERE id = enrollment_rec.referral_code_id
            AND (max_uses IS NULL OR current_uses < max_uses)
            AND NOT EXISTS (
                -- Don't count if we're double-counting
                SELECT 1 FROM referral_tracking rt2
                WHERE rt2.referral_code_id = enrollment_rec.referral_code_id
                AND rt2.enrollment_id != enrollment_rec.id
                AND rt2.created_at < enrollment_rec.created_at
            );

        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Error processing enrollment %: %', enrollment_rec.id, SQLERRM;
                error_count := error_count + 1;
        END;
    END LOOP;

    RAISE NOTICE '✅ Completed fixing existing enrollments!';
    RAISE NOTICE '   • Created % referral_tracking records', tracking_count;
    IF error_count > 0 THEN
        RAISE WARNING '   • Encountered % errors (check warnings above)', error_count;
    END IF;
END $$;

-- Verify the fix
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_count
    FROM enrollments e
    WHERE e.referral_code_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM referral_tracking rt
        WHERE rt.enrollment_id = e.id
    );

    IF missing_count = 0 THEN
        RAISE NOTICE '✅ All enrollments with referral codes now have tracking records!';
    ELSE
        RAISE WARNING '⚠️  Still % enrollments with referral codes missing tracking records', missing_count;
    END IF;
END $$;
