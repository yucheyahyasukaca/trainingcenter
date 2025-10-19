-- ============================================================================
-- CREATE SAMPLE DATA FOR TESTING
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script creates sample data to ensure the application works
-- Run this after FIX_USER_PROFILE_ERROR.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: DISABLE RLS TEMPORARILY
-- ============================================================================

-- Disable RLS on all tables
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: CLEAR EXISTING DATA
-- ============================================================================

-- Clear existing data (optional - comment out if you want to keep existing data)
-- DELETE FROM enrollments;
-- DELETE FROM participants;
-- DELETE FROM programs;
-- DELETE FROM user_profiles WHERE email NOT LIKE '%@garuda-21.com';

-- ============================================================================
-- STEP 3: CREATE USER PROFILES
-- ============================================================================

-- Create admin user
INSERT INTO user_profiles (id, email, full_name, role, is_active, created_at, updated_at)
VALUES (
    '0ade6a79-7c6f-4097-9d03-c8ffea9d43be',
    'admin@garuda-21.com',
    'Admin Garuda-21',
    'admin',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Create manager user
INSERT INTO user_profiles (id, email, full_name, role, is_active, created_at, updated_at)
VALUES (
    '1bde6a79-7c6f-4097-9d03-c8ffea9d43be',
    'managers@garuda-21.com',
    'Manager Garuda-21',
    'manager',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Create regular user
INSERT INTO user_profiles (id, email, full_name, role, is_active, created_at, updated_at)
VALUES (
    '2cde6a79-7c6f-4097-9d03-c8ffea9d43be',
    'user@garuda-21.com',
    'User Garuda-21',
    'user',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ============================================================================
-- STEP 4: CREATE PARTICIPANTS
-- ============================================================================

-- Create participant for regular user
INSERT INTO participants (id, user_id, name, email, phone, address, created_at, updated_at)
VALUES (
    '3dde6a79-7c6f-4097-9d03-c8ffea9d43be',
    '2cde6a79-7c6f-4097-9d03-c8ffea9d43be',
    'User Garuda-21',
    'user@garuda-21.com',
    '+6281234567890',
    'Jakarta, Indonesia',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    updated_at = NOW();

-- ============================================================================
-- STEP 5: CREATE PROGRAMS
-- ============================================================================

-- Program 1: AI & Machine Learning
INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'AI & Machine Learning Fundamentals',
    'Pelatihan dasar AI dan Machine Learning untuk pemula. Mempelajari konsep dasar, algoritma, dan implementasi praktis.',
    'Technology',
    2500000,
    '2024-02-01',
    '2024-02-28',
    30,
    5,
    'published',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    max_participants = EXCLUDED.max_participants,
    current_participants = EXCLUDED.current_participants,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Program 2: Digital Marketing
INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'Digital Marketing Strategy',
    'Strategi pemasaran digital untuk bisnis modern. Mempelajari SEO, SEM, social media marketing, dan analitik.',
    'Marketing',
    1500000,
    '2024-03-01',
    '2024-03-15',
    25,
    3,
    'published',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    max_participants = EXCLUDED.max_participants,
    current_participants = EXCLUDED.current_participants,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Program 3: Data Science
INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    'Data Science & Analytics',
    'Analisis data dan ilmu data untuk pengambilan keputusan. Mempelajari Python, R, SQL, dan machine learning.',
    'Technology',
    3000000,
    '2024-04-01',
    '2024-04-30',
    20,
    2,
    'published',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    max_participants = EXCLUDED.max_participants,
    current_participants = EXCLUDED.current_participants,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Program 4: Leadership
INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440004',
    'Leadership & Management',
    'Kepemimpinan dan manajemen tim yang efektif. Mempelajari soft skills, team building, dan strategic thinking.',
    'Leadership',
    2000000,
    '2024-05-01',
    '2024-05-20',
    15,
    1,
    'published',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    max_participants = EXCLUDED.max_participants,
    current_participants = EXCLUDED.current_participants,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Program 5: Web Development
INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440005',
    'Web Development Bootcamp',
    'Bootcamp pengembangan web full-stack. Mempelajari HTML, CSS, JavaScript, React, Node.js, dan database.',
    'Technology',
    4000000,
    '2024-06-01',
    '2024-06-30',
    35,
    8,
    'published',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    max_participants = EXCLUDED.max_participants,
    current_participants = EXCLUDED.current_participants,
    status = EXCLUDED.status,
    updated_at = NOW();

-- ============================================================================
-- STEP 6: CREATE CLASSES
-- ============================================================================

-- Classes for AI Program
INSERT INTO classes (id, program_id, name, description, start_date, end_date, start_time, end_time, max_participants, current_participants, status, location, room, created_at, updated_at)
VALUES (
    '650e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'Kelas Pagi - AI Fundamentals',
    'Kelas pagi untuk pemula AI',
    '2024-02-01',
    '2024-02-28',
    '09:00:00',
    '12:00:00',
    15,
    3,
    'scheduled',
    'Garuda Academy',
    'Room A-101',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    max_participants = EXCLUDED.max_participants,
    current_participants = EXCLUDED.current_participants,
    status = EXCLUDED.status,
    location = EXCLUDED.location,
    room = EXCLUDED.room,
    updated_at = NOW();

INSERT INTO classes (id, program_id, name, description, start_date, end_date, start_time, end_time, max_participants, current_participants, status, location, room, created_at, updated_at)
VALUES (
    '650e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'Kelas Sore - AI Fundamentals',
    'Kelas sore untuk pemula AI',
    '2024-02-01',
    '2024-02-28',
    '13:00:00',
    '16:00:00',
    15,
    2,
    'scheduled',
    'Garuda Academy',
    'Room A-102',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    max_participants = EXCLUDED.max_participants,
    current_participants = EXCLUDED.current_participants,
    status = EXCLUDED.status,
    location = EXCLUDED.location,
    room = EXCLUDED.room,
    updated_at = NOW();

-- ============================================================================
-- STEP 7: CREATE ENROLLMENTS
-- ============================================================================

-- Create sample enrollments
INSERT INTO enrollments (id, program_id, class_id, participant_id, status, payment_status, created_at, updated_at)
VALUES (
    '750e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    '650e8400-e29b-41d4-a716-446655440001',
    '3dde6a79-7c6f-4097-9d03-c8ffea9d43be',
    'approved',
    'paid',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    program_id = EXCLUDED.program_id,
    class_id = EXCLUDED.class_id,
    participant_id = EXCLUDED.participant_id,
    status = EXCLUDED.status,
    payment_status = EXCLUDED.payment_status,
    updated_at = NOW();

INSERT INTO enrollments (id, program_id, class_id, participant_id, status, payment_status, created_at, updated_at)
VALUES (
    '750e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    NULL,
    '3dde6a79-7c6f-4097-9d03-c8ffea9d43be',
    'pending',
    'unpaid',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    program_id = EXCLUDED.program_id,
    class_id = EXCLUDED.class_id,
    participant_id = EXCLUDED.participant_id,
    status = EXCLUDED.status,
    payment_status = EXCLUDED.payment_status,
    updated_at = NOW();

-- ============================================================================
-- STEP 8: ENABLE RLS WITH SIMPLE POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "user_profiles_select_all" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "user_profiles_insert_all" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "user_profiles_update_all" ON user_profiles FOR UPDATE USING (true);

CREATE POLICY "programs_select_all" ON programs FOR SELECT USING (true);
CREATE POLICY "programs_insert_all" ON programs FOR INSERT WITH CHECK (true);
CREATE POLICY "programs_update_all" ON programs FOR UPDATE USING (true);
CREATE POLICY "programs_delete_all" ON programs FOR DELETE USING (true);

CREATE POLICY "classes_select_all" ON classes FOR SELECT USING (true);
CREATE POLICY "classes_insert_all" ON classes FOR INSERT WITH CHECK (true);
CREATE POLICY "classes_update_all" ON classes FOR UPDATE USING (true);
CREATE POLICY "classes_delete_all" ON classes FOR DELETE USING (true);

CREATE POLICY "participants_select_all" ON participants FOR SELECT USING (true);
CREATE POLICY "participants_insert_all" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "participants_update_all" ON participants FOR UPDATE USING (true);
CREATE POLICY "participants_delete_all" ON participants FOR DELETE USING (true);

CREATE POLICY "enrollments_select_all" ON enrollments FOR SELECT USING (true);
CREATE POLICY "enrollments_insert_all" ON enrollments FOR INSERT WITH CHECK (true);
CREATE POLICY "enrollments_update_all" ON enrollments FOR UPDATE USING (true);
CREATE POLICY "enrollments_delete_all" ON enrollments FOR DELETE USING (true);

-- ============================================================================
-- STEP 9: VERIFY DATA
-- ============================================================================

-- Check all data
SELECT 'User Profiles' as table_name, COUNT(*) as count FROM user_profiles;
SELECT 'Programs' as table_name, COUNT(*) as count FROM programs;
SELECT 'Classes' as table_name, COUNT(*) as count FROM classes;
SELECT 'Participants' as table_name, COUNT(*) as count FROM participants;
SELECT 'Enrollments' as table_name, COUNT(*) as count FROM enrollments;

-- Test specific queries
SELECT 'Testing user profile query' as test_name;
SELECT * FROM user_profiles WHERE id = '0ade6a79-7c6f-4097-9d03-c8ffea9d43be';

SELECT 'Testing programs query' as test_name;
SELECT * FROM programs WHERE status = 'published';

SELECT 'Testing enrollments query' as test_name;
SELECT 
    e.*,
    p.title as program_title,
    part.name as participant_name
FROM enrollments e
JOIN programs p ON e.program_id = p.id
JOIN participants part ON e.participant_id = part.id
ORDER BY e.created_at DESC
LIMIT 5;

-- ============================================================================
-- SAMPLE DATA CREATED!
-- ============================================================================
-- 
-- Your database now has sample data for testing!
-- 
-- What was created:
-- ✅ 3 user profiles (admin, manager, user)
-- ✅ 1 participant record
-- ✅ 5 programs (all published)
-- ✅ 2 classes
-- ✅ 2 enrollments
-- ✅ Simple RLS policies
-- 
-- Your application should now work without errors!
-- ============================================================================
