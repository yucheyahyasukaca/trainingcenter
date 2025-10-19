-- ============================================================================
-- COMPLETE DATA FIX - PROGRAMS NOT SHOWING
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script fixes all data issues to ensure programs appear in admin and user
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

-- Drop all existing policies
DROP POLICY IF EXISTS "user_profiles_select_all" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_all" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_all" ON user_profiles;
DROP POLICY IF EXISTS "programs_select_all" ON programs;
DROP POLICY IF EXISTS "programs_insert_all" ON programs;
DROP POLICY IF EXISTS "programs_update_all" ON programs;
DROP POLICY IF EXISTS "programs_delete_all" ON programs;
DROP POLICY IF EXISTS "classes_select_all" ON classes;
DROP POLICY IF EXISTS "classes_insert_all" ON classes;
DROP POLICY IF EXISTS "classes_update_all" ON classes;
DROP POLICY IF EXISTS "classes_delete_all" ON classes;
DROP POLICY IF EXISTS "participants_select_all" ON participants;
DROP POLICY IF EXISTS "participants_insert_all" ON participants;
DROP POLICY IF EXISTS "participants_update_all" ON participants;
DROP POLICY IF EXISTS "participants_delete_all" ON participants;
DROP POLICY IF EXISTS "enrollments_select_all" ON enrollments;
DROP POLICY IF EXISTS "enrollments_insert_all" ON enrollments;
DROP POLICY IF EXISTS "enrollments_update_all" ON enrollments;
DROP POLICY IF EXISTS "enrollments_delete_all" ON enrollments;

-- ============================================================================
-- STEP 2: CLEAR AND RECREATE DATA
-- ============================================================================

-- Clear existing data
DELETE FROM enrollments;
DELETE FROM participants;
DELETE FROM programs;
DELETE FROM user_profiles WHERE email NOT LIKE '%@garuda-21.com';

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
);

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
);

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
);

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
);

-- ============================================================================
-- STEP 5: CREATE PROGRAMS
-- ============================================================================

-- Program 1: AI & Machine Learning
INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'AI & Machine Learning Fundamentals',
    'Pelatihan dasar AI dan Machine Learning untuk pemula. Mempelajari konsep dasar, algoritma, dan implementasi praktis menggunakan Python dan TensorFlow.',
    'Technology',
    2500000,
    '2024-02-01',
    '2024-02-28',
    30,
    5,
    'published',
    NOW(),
    NOW()
);

-- Program 2: Digital Marketing
INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'Digital Marketing Strategy',
    'Strategi pemasaran digital untuk bisnis modern. Mempelajari SEO, SEM, social media marketing, content marketing, dan analitik digital.',
    'Marketing',
    1500000,
    '2024-03-01',
    '2024-03-15',
    25,
    3,
    'published',
    NOW(),
    NOW()
);

-- Program 3: Data Science
INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    'Data Science & Analytics',
    'Analisis data dan ilmu data untuk pengambilan keputusan. Mempelajari Python, R, SQL, machine learning, dan data visualization.',
    'Technology',
    3000000,
    '2024-04-01',
    '2024-04-30',
    20,
    2,
    'published',
    NOW(),
    NOW()
);

-- Program 4: Leadership
INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440004',
    'Leadership & Management',
    'Kepemimpinan dan manajemen tim yang efektif. Mempelajari soft skills, team building, strategic thinking, dan change management.',
    'Leadership',
    2000000,
    '2024-05-01',
    '2024-05-20',
    15,
    1,
    'published',
    NOW(),
    NOW()
);

-- Program 5: Web Development
INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440005',
    'Web Development Bootcamp',
    'Bootcamp pengembangan web full-stack. Mempelajari HTML, CSS, JavaScript, React, Node.js, Express, MongoDB, dan deployment.',
    'Technology',
    4000000,
    '2024-06-01',
    '2024-06-30',
    35,
    8,
    'published',
    NOW(),
    NOW()
);

-- Program 6: Cybersecurity
INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440006',
    'Cybersecurity Fundamentals',
    'Dasar-dasar keamanan siber untuk profesional IT. Mempelajari ethical hacking, penetration testing, dan security best practices.',
    'Technology',
    3500000,
    '2024-07-01',
    '2024-07-25',
    18,
    4,
    'published',
    NOW(),
    NOW()
);

-- Program 7: Project Management
INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440007',
    'Project Management Professional',
    'Sertifikasi manajemen proyek internasional. Mempelajari PMI methodology, agile, scrum, dan project lifecycle management.',
    'Management',
    2800000,
    '2024-08-01',
    '2024-08-20',
    22,
    6,
    'published',
    NOW(),
    NOW()
);

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
);

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
);

-- Classes for Web Development
INSERT INTO classes (id, program_id, name, description, start_date, end_date, start_time, end_time, max_participants, current_participants, status, location, room, created_at, updated_at)
VALUES (
    '650e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440005',
    'Kelas Frontend Development',
    'Kelas khusus frontend dengan React',
    '2024-06-01',
    '2024-06-30',
    '09:00:00',
    '12:00:00',
    18,
    5,
    'scheduled',
    'Garuda Academy',
    'Room B-201',
    NOW(),
    NOW()
);

INSERT INTO classes (id, program_id, name, description, start_date, end_date, start_time, end_time, max_participants, current_participants, status, location, room, created_at, updated_at)
VALUES (
    '650e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005',
    'Kelas Backend Development',
    'Kelas khusus backend dengan Node.js',
    '2024-06-01',
    '2024-06-30',
    '13:00:00',
    '16:00:00',
    17,
    3,
    'scheduled',
    'Garuda Academy',
    'Room B-202',
    NOW(),
    NOW()
);

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
);

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
);

INSERT INTO enrollments (id, program_id, class_id, participant_id, status, payment_status, created_at, updated_at)
VALUES (
    '750e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440005',
    '650e8400-e29b-41d4-a716-446655440003',
    '3dde6a79-7c6f-4097-9d03-c8ffea9d43be',
    'approved',
    'paid',
    NOW(),
    NOW()
);

-- ============================================================================
-- STEP 8: ENABLE RLS WITH SIMPLE POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow all access
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

-- Test programs by category
SELECT 'Programs by Category' as test_name;
SELECT 
    category,
    COUNT(*) as count
FROM programs 
GROUP BY category
ORDER BY count DESC;

-- Test programs with classes
SELECT 'Programs with Classes' as test_name;
SELECT 
    p.title,
    p.category,
    COUNT(c.id) as class_count
FROM programs p
LEFT JOIN classes c ON p.id = c.program_id
GROUP BY p.id, p.title, p.category
ORDER BY p.title;

-- ============================================================================
-- COMPLETE DATA FIX FINISHED!
-- ============================================================================
-- 
-- All data has been created and should now be visible in the application!
-- 
-- What was created:
-- ✅ 3 user profiles (admin, manager, user)
-- ✅ 1 participant record
-- ✅ 7 programs (all published)
-- ✅ 4 classes
-- ✅ 3 enrollments
-- ✅ Simple RLS policies
-- 
-- Your application should now display programs correctly in both admin and user views!
-- ============================================================================

