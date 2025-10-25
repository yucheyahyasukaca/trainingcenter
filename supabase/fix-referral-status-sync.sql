-- ============================================================================
-- FIX REFERRAL STATUS SYNCHRONIZATION
-- ============================================================================
-- Script untuk memperbaiki sinkronisasi status referral dengan enrollment

-- ============================================================================
-- STEP 1: ENSURE REFERRAL TABLES EXIST
-- ============================================================================

-- Ensure referral_tracking table exists
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
    END IF;
END $$;

-- ============================================================================
-- STEP 2: CREATE/UPDATE REFERRAL STATUS UPDATE FUNCTION
-- ============================================================================

-- Function untuk update referral status saat enrollment status berubah
CREATE OR REPLACE FUNCTION update_referral_status(
    p_enrollment_id UUID,
    p_new_status VARCHAR(20)
)
RETURNS VOID AS $$
DECLARE
    ref_status VARCHAR(20);
    updated_count INTEGER;
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
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Log the update
    RAISE NOTICE 'Updated % referral records for enrollment % to status %', updated_count, p_enrollment_id, ref_status;
    
    -- If confirmed, create reward record (if not exists)
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
        AND rt.commission_earned > 0
        AND NOT EXISTS (
            SELECT 1 FROM referral_rewards rr 
            WHERE rr.referral_tracking_id = rt.id
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: CREATE/UPDATE TRIGGER FUNCTION
-- ============================================================================

-- Trigger function untuk update referral status saat enrollment status berubah
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

-- ============================================================================
-- STEP 4: CREATE/UPDATE TRIGGER
-- ============================================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_enrollment_status_change ON enrollments;

-- Create trigger for updating referral status
CREATE TRIGGER trigger_enrollment_status_change
    AFTER UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_referral_status();

-- ============================================================================
-- STEP 5: CREATE MANUAL SYNC FUNCTION FOR EXISTING DATA
-- ============================================================================

-- Function untuk sync semua referral status yang tidak sinkron
CREATE OR REPLACE FUNCTION sync_all_referral_status()
RETURNS TABLE(
    enrollment_id UUID,
    enrollment_status VARCHAR(20),
    referral_status VARCHAR(20),
    updated BOOLEAN
) AS $$
DECLARE
    rec RECORD;
    new_status VARCHAR(20);
BEGIN
    -- Loop through all referral tracking records
    FOR rec IN 
        SELECT 
            rt.enrollment_id,
            rt.status as referral_status,
            e.status as enrollment_status
        FROM referral_tracking rt
        JOIN enrollments e ON rt.enrollment_id = e.id
    LOOP
        -- Determine correct referral status based on enrollment status
        new_status := CASE 
            WHEN rec.enrollment_status = 'approved' THEN 'confirmed'
            WHEN rec.enrollment_status = 'rejected' OR rec.enrollment_status = 'cancelled' THEN 'cancelled'
            ELSE 'pending'
        END;
        
        -- Update if status is different
        IF rec.referral_status != new_status THEN
            UPDATE referral_tracking
            SET status = new_status, updated_at = NOW()
            WHERE referral_tracking.enrollment_id = rec.enrollment_id;
            
            RETURN QUERY SELECT rec.enrollment_id, rec.enrollment_status, new_status, true;
        ELSE
            RETURN QUERY SELECT rec.enrollment_id, rec.enrollment_status, rec.referral_status, false;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: CREATE FUNCTION TO UPDATE SPECIFIC ENROLLMENT REFERRAL STATUS
-- ============================================================================

-- Function untuk update referral status untuk enrollment tertentu
CREATE OR REPLACE FUNCTION update_enrollment_referral_status(p_enrollment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    enrollment_status VARCHAR(20);
    updated_count INTEGER;
BEGIN
    -- Get enrollment status
    SELECT status INTO enrollment_status
    FROM enrollments
    WHERE id = p_enrollment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Enrollment not found: %', p_enrollment_id;
    END IF;
    
    -- Update referral status
    PERFORM update_referral_status(p_enrollment_id, enrollment_status);
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_referral_status TO authenticated;
GRANT EXECUTE ON FUNCTION sync_all_referral_status TO authenticated;
GRANT EXECUTE ON FUNCTION update_enrollment_referral_status TO authenticated;

-- ============================================================================
-- STEP 8: RUN INITIAL SYNC
-- ============================================================================

-- Sync all existing referral statuses
DO $$
DECLARE
    sync_result RECORD;
    total_updated INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting referral status synchronization...';
    
    FOR sync_result IN SELECT * FROM sync_all_referral_status() LOOP
        IF sync_result.updated THEN
            total_updated := total_updated + 1;
            RAISE NOTICE 'Updated enrollment %: % -> %', 
                sync_result.enrollment_id, 
                sync_result.referral_status, 
                CASE 
                    WHEN sync_result.enrollment_status = 'approved' THEN 'confirmed'
                    WHEN sync_result.enrollment_status = 'rejected' OR sync_result.enrollment_status = 'cancelled' THEN 'cancelled'
                    ELSE 'pending'
                END;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Referral status synchronization completed. Updated % records.', total_updated;
END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Referral status synchronization fix completed successfully!';
    RAISE NOTICE '📊 Functions created/updated:';
    RAISE NOTICE '   • update_referral_status';
    RAISE NOTICE '   • trigger_update_referral_status';
    RAISE NOTICE '   • sync_all_referral_status';
    RAISE NOTICE '   • update_enrollment_referral_status';
    RAISE NOTICE '🔧 Trigger created/updated:';
    RAISE NOTICE '   • trigger_enrollment_status_change';
    RAISE NOTICE '🔄 Initial sync completed for existing data';
    RAISE NOTICE '💡 Manual sync can be run with: SELECT * FROM sync_all_referral_status();';
END $$;
