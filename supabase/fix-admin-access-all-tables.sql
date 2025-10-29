-- ============================================================================
-- FIX ADMIN ACCESS TO ALL TABLES
-- ============================================================================
-- Script untuk memastikan admin memiliki akses penuh ke semua tabel
-- Admin harus bisa membaca semua hal: programs, classes, trainers, participants, enrollments, dll
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE/REPLACE HELPER FUNCTION FOR ADMIN CHECK
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = p_user_id 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin or manager
CREATE OR REPLACE FUNCTION is_user_admin_or_manager(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = p_user_id 
        AND role IN ('admin', 'manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 2: FIX PARTICIPANTS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own participant record" ON participants;
DROP POLICY IF EXISTS "Users can insert their own participant record" ON participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON participants;
DROP POLICY IF EXISTS "Users can delete their own participant record" ON participants;
DROP POLICY IF EXISTS "Admins and managers can manage all participants" ON participants;
DROP POLICY IF EXISTS "Admin can view all participants" ON participants;
DROP POLICY IF EXISTS "Admin can manage all participants" ON participants;

-- Create new comprehensive policies
CREATE POLICY "Users can view their own participant record" ON participants
FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY "Users can insert their own participant record" ON participants
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participant record" ON participants
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own participant record" ON participants
FOR DELETE USING (user_id = auth.uid());

-- Admin has full access to all participants
CREATE POLICY "Admin can view all participants" ON participants
FOR SELECT USING (is_user_admin(auth.uid()));

CREATE POLICY "Admin can manage all participants" ON participants
FOR ALL USING (is_user_admin(auth.uid()));

-- ============================================================================
-- STEP 3: FIX PROGRAMS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Everyone can view published programs" ON programs;
DROP POLICY IF EXISTS "Admins and managers can view all programs" ON programs;
DROP POLICY IF EXISTS "Admins and managers can manage programs" ON programs;
DROP POLICY IF EXISTS "Admin can view all programs" ON programs;
DROP POLICY IF EXISTS "Admin can manage all programs" ON programs;

-- Create new comprehensive policies
CREATE POLICY "Everyone can view published programs" ON programs
FOR SELECT USING (status = 'published');

-- Admin has full access to all programs
CREATE POLICY "Admin can view all programs" ON programs
FOR SELECT USING (is_user_admin(auth.uid()));

CREATE POLICY "Admin can manage all programs" ON programs
FOR ALL USING (is_user_admin(auth.uid()));

-- ============================================================================
-- STEP 4: FIX CLASSES TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Everyone can view classes of published programs" ON classes;
DROP POLICY IF EXISTS "Admins and managers can manage classes" ON classes;
DROP POLICY IF EXISTS "Admin can view all classes" ON classes;
DROP POLICY IF EXISTS "Admin can manage all classes" ON classes;

-- Create new comprehensive policies
CREATE POLICY "Everyone can view classes of published programs" ON classes
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM programs 
        WHERE id = program_id AND status = 'published'
    )
);

-- Admin has full access to all classes
CREATE POLICY "Admin can view all classes" ON classes
FOR SELECT USING (is_user_admin(auth.uid()));

CREATE POLICY "Admin can manage all classes" ON classes
FOR ALL USING (is_user_admin(auth.uid()));

-- ============================================================================
-- STEP 5: FIX CLASS_TRAINERS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Everyone can view class trainers" ON class_trainers;
DROP POLICY IF EXISTS "Admins and managers can manage class trainers" ON class_trainers;
DROP POLICY IF EXISTS "Admin can manage all class trainers" ON class_trainers;

-- Create new comprehensive policies
CREATE POLICY "Everyone can view class trainers" ON class_trainers
FOR SELECT USING (true);

-- Admin has full access to class_trainers
CREATE POLICY "Admin can manage all class trainers" ON class_trainers
FOR ALL USING (is_user_admin(auth.uid()));

-- ============================================================================
-- STEP 6: FIX ENROLLMENTS TABLE POLICIES (THIS INCLUDES PAYMENT DATA)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can create enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins and managers can manage all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admin can view all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admin can manage all enrollments" ON enrollments;

-- Create new comprehensive policies
CREATE POLICY "Users can view their own enrollments" ON enrollments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM participants 
        WHERE id = participant_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can create enrollments" ON enrollments
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM participants 
        WHERE id = participant_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own enrollments" ON enrollments
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM participants 
        WHERE id = participant_id AND user_id = auth.uid()
    )
);

-- Admin has full access to all enrollments (including payment data)
CREATE POLICY "Admin can view all enrollments" ON enrollments
FOR SELECT USING (is_user_admin(auth.uid()));

CREATE POLICY "Admin can manage all enrollments" ON enrollments
FOR ALL USING (is_user_admin(auth.uid()));

-- ============================================================================
-- STEP 6A: FIX REFERRAL CODES TABLE POLICIES (if exists)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can view all referral codes" ON referral_codes;
DROP POLICY IF EXISTS "Admin can manage all referral codes" ON referral_codes;

-- Create admin access policies for referral_codes table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_codes') THEN
        -- Admin has full access to referral codes
        EXECUTE 'CREATE POLICY "Admin can view all referral codes" ON referral_codes FOR SELECT USING (is_user_admin(auth.uid()))';
        EXECUTE 'CREATE POLICY "Admin can manage all referral codes" ON referral_codes FOR ALL USING (is_user_admin(auth.uid()))';
    END IF;
END $$;

-- ============================================================================
-- STEP 6B: FIX REFERRAL REWARDS TABLE POLICIES (if exists)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can view all referral rewards" ON referral_rewards;
DROP POLICY IF EXISTS "Admin can manage all referral rewards" ON referral_rewards;

-- Create admin access policies for referral_rewards table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_rewards') THEN
        -- Admin has full access to referral rewards
        EXECUTE 'CREATE POLICY "Admin can view all referral rewards" ON referral_rewards FOR SELECT USING (is_user_admin(auth.uid()))';
        EXECUTE 'CREATE POLICY "Admin can manage all referral rewards" ON referral_rewards FOR ALL USING (is_user_admin(auth.uid()))';
    END IF;
END $$;

-- ============================================================================
-- STEP 6C: FIX REFERRAL TRACKING TABLE POLICIES (if exists)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can view all referral tracking" ON referral_tracking;
DROP POLICY IF EXISTS "Admin can manage all referral tracking" ON referral_tracking;

-- Create admin access policies for referral_tracking table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_tracking') THEN
        -- Admin has full access to referral tracking
        EXECUTE 'CREATE POLICY "Admin can view all referral tracking" ON referral_tracking FOR SELECT USING (is_user_admin(auth.uid()))';
        EXECUTE 'CREATE POLICY "Admin can manage all referral tracking" ON referral_tracking FOR ALL USING (is_user_admin(auth.uid()))';
    END IF;
END $$;

-- ============================================================================
-- STEP 6D: FIX REFERRAL POLICIES TABLE POLICIES (if exists)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can view all referral policies" ON referral_policies;
DROP POLICY IF EXISTS "Admin can manage all referral policies" ON referral_policies;

-- Create admin access policies for referral_policies table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_policies') THEN
        -- Admin has full access to referral policies
        EXECUTE 'CREATE POLICY "Admin can view all referral policies" ON referral_policies FOR SELECT USING (is_user_admin(auth.uid()))';
        EXECUTE 'CREATE POLICY "Admin can manage all referral policies" ON referral_policies FOR ALL USING (is_user_admin(auth.uid()))';
    END IF;
END $$;

-- ============================================================================
-- STEP 7: FIX TRAINERS TABLE POLICIES (if exists)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can view all trainers" ON trainers;
DROP POLICY IF EXISTS "Admin can manage all trainers" ON trainers;

-- Create admin access policies for trainers table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trainers') THEN
        -- Admin has full access to trainers
        EXECUTE 'CREATE POLICY "Admin can view all trainers" ON trainers FOR SELECT USING (is_user_admin(auth.uid()))';
        EXECUTE 'CREATE POLICY "Admin can manage all trainers" ON trainers FOR ALL USING (is_user_admin(auth.uid()))';
    END IF;
END $$;

-- ============================================================================
-- STEP 8: FIX USER_PROFILES TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON user_profiles;

-- Create new comprehensive policies
CREATE POLICY "Users can view their own profile" ON user_profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
FOR UPDATE USING (id = auth.uid());

-- Admin has full access to all profiles
CREATE POLICY "Admin can view all profiles" ON user_profiles
FOR SELECT USING (is_user_admin(auth.uid()));

CREATE POLICY "Admin can update all profiles" ON user_profiles
FOR UPDATE USING (is_user_admin(auth.uid()));

-- ============================================================================
-- STEP 9: VERIFY ADMIN ACCESS
-- ============================================================================

-- Test query to verify admin can see all data
DO $$
DECLARE
    admin_id UUID;
    participant_count INTEGER;
    program_count INTEGER;
    class_count INTEGER;
    enrollment_count INTEGER;
    payment_count INTEGER;
BEGIN
    -- Get first admin user
    SELECT id INTO admin_id FROM user_profiles WHERE role = 'admin' LIMIT 1;
    
    IF admin_id IS NULL THEN
        RAISE NOTICE 'No admin user found. Please create an admin user first.';
    ELSE
        RAISE NOTICE 'Admin user found: %', admin_id;
        
        -- Check participant count (will show 0 if no access)
        SELECT COUNT(*) INTO participant_count FROM participants;
        RAISE NOTICE 'Total participants in database: %', participant_count;
        
        -- Check program count
        SELECT COUNT(*) INTO program_count FROM programs;
        RAISE NOTICE 'Total programs in database: %', program_count;
        
        -- Check class count
        SELECT COUNT(*) INTO class_count FROM classes;
        RAISE NOTICE 'Total classes in database: %', class_count;
        
        -- Check enrollment count
        SELECT COUNT(*) INTO enrollment_count FROM enrollments;
        RAISE NOTICE 'Total enrollments in database: %', enrollment_count;
        
        -- Check payment count (enrollments with payment proof)
        SELECT COUNT(*) INTO payment_count FROM enrollments WHERE payment_proof_url IS NOT NULL;
        RAISE NOTICE 'Total payments with proof in database: %', payment_count;
        
        -- Check referral data if tables exist
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_codes') THEN
            DECLARE
                referral_codes_count INTEGER;
                referral_tracking_count INTEGER;
                referral_rewards_count INTEGER;
                referral_policies_count INTEGER;
            BEGIN
                SELECT COUNT(*) INTO referral_codes_count FROM referral_codes;
                SELECT COUNT(*) INTO referral_tracking_count FROM referral_tracking;
                SELECT COUNT(*) INTO referral_rewards_count FROM referral_rewards;
                SELECT COUNT(*) INTO referral_policies_count FROM referral_policies;
                
                RAISE NOTICE 'Total referral codes: %', referral_codes_count;
                RAISE NOTICE 'Total referral tracking: %', referral_tracking_count;
                RAISE NOTICE 'Total referral rewards: %', referral_rewards_count;
                RAISE NOTICE 'Total referral policies: %', referral_policies_count;
            END;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- SCRIPT COMPLETE
-- ============================================================================
-- Admin sekarang memiliki akses penuh ke semua tabel
-- ============================================================================
