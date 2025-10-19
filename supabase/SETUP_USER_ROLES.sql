-- ============================================================================
-- USER ROLES SETUP SCRIPT
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script sets up user roles and creates admin users
-- Run this AFTER running the COMPLETE_MIGRATION_SCRIPT.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE ADMIN USER IN AUTH.USERS
-- ============================================================================
-- 
-- First, create admin user in Supabase Auth Dashboard or using Supabase CLI:
-- 
-- Using Supabase CLI:
-- supabase auth signup --email admin@garudaacademy.com --password AdminPassword123!
-- 
-- Or manually in Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add user"
-- 3. Email: admin@garudaacademy.com
-- 4. Password: AdminPassword123!
-- 5. Auto Confirm User: Yes
-- 
-- ============================================================================

-- ============================================================================
-- STEP 2: UPDATE ADMIN USER PROFILE
-- ============================================================================
-- 
-- After creating the admin user, get their UUID and update this script:
-- 
-- 1. Go to Authentication > Users
-- 2. Find your admin user
-- 3. Copy their UUID
-- 4. Replace 'YOUR_ADMIN_UUID_HERE' with the actual UUID
-- 
-- ============================================================================

-- Update admin user profile (replace with actual UUID)
/*
UPDATE user_profiles 
SET 
    email = 'admin@garudaacademy.com',
    full_name = 'Admin Garuda Academy',
    role = 'admin',
    is_active = true,
    updated_at = NOW()
WHERE id = 'YOUR_ADMIN_UUID_HERE';

-- If admin user doesn't exist in user_profiles, create it
INSERT INTO user_profiles (id, email, full_name, role, is_active)
SELECT 'YOUR_ADMIN_UUID_HERE', 'admin@garudaacademy.com', 'Admin Garuda Academy', 'admin', true
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = 'YOUR_ADMIN_UUID_HERE');
*/

-- ============================================================================
-- STEP 3: CREATE SAMPLE USERS
-- ============================================================================

-- Create sample manager user
/*
INSERT INTO user_profiles (id, email, full_name, role, is_active, created_at)
SELECT 
    uuid_generate_v4(),
    'manager@garudaacademy.com',
    'Manager Garuda Academy',
    'manager',
    true,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE email = 'manager@garudaacademy.com');
*/

-- Create sample trainer user
/*
INSERT INTO user_profiles (id, email, full_name, role, trainer_level, trainer_experience_years, trainer_specializations, is_active, created_at)
SELECT 
    uuid_generate_v4(),
    'trainer@garudaacademy.com',
    'Trainer Garuda Academy',
    'user',
    'senior',
    5,
    ARRAY['AI/ML', 'Data Science', 'Web Development'],
    true,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE email = 'trainer@garudaacademy.com');
*/

-- Create sample regular user
/*
INSERT INTO user_profiles (id, email, full_name, role, is_active, created_at)
SELECT 
    uuid_generate_v4(),
    'user@garudaacademy.com',
    'User Garuda Academy',
    'user',
    true,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE email = 'user@garudaacademy.com');
*/

-- ============================================================================
-- STEP 4: CREATE PARTICIPANT RECORDS
-- ============================================================================

-- Create participant record for sample users
/*
INSERT INTO participants (id, user_id, name, email, phone, address, created_at)
SELECT 
    uuid_generate_v4(),
    up.id,
    up.full_name,
    up.email,
    '+6281234567890',
    'Jakarta, Indonesia',
    NOW()
FROM user_profiles up
WHERE up.role = 'user'
AND NOT EXISTS (SELECT 1 FROM participants p WHERE p.user_id = up.id);
*/

-- ============================================================================
-- STEP 5: ROLE-BASED PERMISSIONS SETUP
-- ============================================================================

-- Create function to check user role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS user_role AS $$
DECLARE
    user_role user_role;
BEGIN
    SELECT role INTO user_role
    FROM user_profiles
    WHERE id = p_user_id;
    
    RETURN COALESCE(user_role, 'user'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin or manager
CREATE OR REPLACE FUNCTION is_admin_or_manager(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = p_user_id 
        AND role IN ('admin', 'manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = p_user_id 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: ENHANCED RLS POLICIES WITH ROLE CHECKS
-- ============================================================================

-- Drop existing policies and recreate with better role checking
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins and managers can view all programs" ON programs;
DROP POLICY IF EXISTS "Admins and managers can manage programs" ON programs;
DROP POLICY IF EXISTS "Admins and managers can manage classes" ON classes;
DROP POLICY IF EXISTS "Admins and managers can manage class trainers" ON class_trainers;
DROP POLICY IF EXISTS "Admins and managers can manage all participants" ON participants;
DROP POLICY IF EXISTS "Admins and managers can manage all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins and managers can manage forum categories" ON forum_categories;

-- Recreate policies with function-based role checking
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON user_profiles
    FOR UPDATE USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins and managers can view all programs" ON programs
    FOR SELECT USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins and managers can manage programs" ON programs
    FOR ALL USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins and managers can manage classes" ON classes
    FOR ALL USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins and managers can manage class trainers" ON class_trainers
    FOR ALL USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins and managers can manage all participants" ON participants
    FOR ALL USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins and managers can manage all enrollments" ON enrollments
    FOR ALL USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins and managers can manage forum categories" ON forum_categories
    FOR ALL USING (is_admin_or_manager(auth.uid()));

-- ============================================================================
-- STEP 7: CREATE ROLE MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to promote user to manager (admin only)
CREATE OR REPLACE FUNCTION promote_to_manager(p_user_id UUID, p_promoted_by UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if promoter is admin
    IF NOT is_admin(p_promoted_by) THEN
        RAISE EXCEPTION 'Only admins can promote users to manager';
    END IF;
    
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Promote user
    UPDATE user_profiles 
    SET 
        role = 'manager',
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to demote manager to user (admin only)
CREATE OR REPLACE FUNCTION demote_manager(p_user_id UUID, p_demoted_by UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if demoter is admin
    IF NOT is_admin(p_demoted_by) THEN
        RAISE EXCEPTION 'Only admins can demote managers';
    END IF;
    
    -- Check if user is manager
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = p_user_id AND role = 'manager') THEN
        RAISE EXCEPTION 'User is not a manager';
    END IF;
    
    -- Demote user
    UPDATE user_profiles 
    SET 
        role = 'user',
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update trainer level (admin/manager only)
CREATE OR REPLACE FUNCTION update_trainer_level(p_user_id UUID, p_trainer_level trainer_level, p_updated_by UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if updater is admin or manager
    IF NOT is_admin_or_manager(p_updated_by) THEN
        RAISE EXCEPTION 'Only admins and managers can update trainer levels';
    END IF;
    
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Update trainer level
    UPDATE user_profiles 
    SET 
        trainer_level = p_trainer_level,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 8: CREATE ROLE-BASED VIEWS
-- ============================================================================

-- View for admin dashboard
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM user_profiles WHERE role = 'user') as total_users,
    (SELECT COUNT(*) FROM user_profiles WHERE role = 'manager') as total_managers,
    (SELECT COUNT(*) FROM programs) as total_programs,
    (SELECT COUNT(*) FROM enrollments) as total_enrollments,
    (SELECT COUNT(*) FROM enrollments WHERE status = 'pending') as pending_enrollments,
    (SELECT COUNT(*) FROM enrollments WHERE status = 'approved') as approved_enrollments,
    (SELECT COUNT(*) FROM enrollments WHERE payment_status = 'paid') as paid_enrollments;

-- View for manager dashboard
CREATE OR REPLACE VIEW manager_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM programs WHERE trainer_id = auth.uid()) as my_programs,
    (SELECT COUNT(*) FROM enrollments e 
     JOIN programs p ON e.program_id = p.id 
     WHERE p.trainer_id = auth.uid()) as my_enrollments,
    (SELECT COUNT(*) FROM enrollments e 
     JOIN programs p ON e.program_id = p.id 
     WHERE p.trainer_id = auth.uid() AND e.status = 'pending') as pending_my_enrollments;

-- View for user dashboard
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM enrollments e 
     JOIN participants p ON e.participant_id = p.id 
     WHERE p.user_id = auth.uid()) as my_enrollments,
    (SELECT COUNT(*) FROM enrollments e 
     JOIN participants p ON e.participant_id = p.id 
     WHERE p.user_id = auth.uid() AND e.status = 'approved') as approved_enrollments,
    (SELECT COUNT(*) FROM enrollments e 
     JOIN participants p ON e.participant_id = p.id 
     WHERE p.user_id = auth.uid() AND e.status = 'pending') as pending_enrollments;

-- ============================================================================
-- STEP 9: CREATE SAMPLE DATA WITH ROLES
-- ============================================================================

-- Insert sample admin (replace UUID with actual admin UUID)
/*
INSERT INTO user_profiles (id, email, full_name, role, is_active, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@garudaacademy.com', 'Admin Garuda Academy', 'admin', true, NOW())
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
*/

-- Insert sample manager
INSERT INTO user_profiles (id, email, full_name, role, is_active, created_at) VALUES
('00000000-0000-0000-0000-000000000002', 'manager@garudaacademy.com', 'Manager Garuda Academy', 'manager', true, NOW())
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Insert sample trainer
INSERT INTO user_profiles (id, email, full_name, role, trainer_level, trainer_experience_years, trainer_specializations, is_active, created_at) VALUES
('00000000-0000-0000-0000-000000000003', 'trainer@garudaacademy.com', 'Trainer Garuda Academy', 'user', 'senior', 5, ARRAY['AI/ML', 'Data Science'], true, NOW())
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    trainer_level = EXCLUDED.trainer_level,
    trainer_experience_years = EXCLUDED.trainer_experience_years,
    trainer_specializations = EXCLUDED.trainer_specializations,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Insert sample regular user
INSERT INTO user_profiles (id, email, full_name, role, is_active, created_at) VALUES
('00000000-0000-0000-0000-000000000004', 'user@garudaacademy.com', 'User Garuda Academy', 'user', true, NOW())
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ============================================================================
-- STEP 10: VERIFICATION QUERIES
-- ============================================================================

-- Check user roles
SELECT 
    email,
    full_name,
    role,
    trainer_level,
    is_active,
    created_at
FROM user_profiles 
ORDER BY role, created_at;

-- Check role-based functions
SELECT 
    'get_user_role' as function_name,
    get_user_role('00000000-0000-0000-0000-000000000002') as manager_role,
    get_user_role('00000000-0000-0000-0000-000000000004') as user_role;

SELECT 
    'is_admin_or_manager' as function_name,
    is_admin_or_manager('00000000-0000-0000-0000-000000000002') as manager_check,
    is_admin_or_manager('00000000-0000-0000-0000-000000000004') as user_check;

-- Check dashboard views
SELECT * FROM admin_dashboard_stats;
SELECT * FROM manager_dashboard_stats;
SELECT * FROM user_dashboard_stats;

-- ============================================================================
-- ROLE SETUP COMPLETE!
-- ============================================================================
-- 
-- Your user roles system is now ready!
-- 
-- Next steps:
-- 1. Create your admin user in Supabase Auth Dashboard
-- 2. Update the admin UUID in this script
-- 3. Run the script to set up roles
-- 4. Test role-based access in your application
-- 
-- ============================================================================
