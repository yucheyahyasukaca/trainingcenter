-- ============================================================================
-- DATA MIGRATION SCRIPT FROM SUPABASE CLOUD TO SELF-HOSTING
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script helps migrate existing data from Supabase Cloud to Self-Hosting.
-- Run this AFTER running the COMPLETE_MIGRATION_SCRIPT.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: EXPORT DATA FROM SUPABASE CLOUD
-- ============================================================================
-- 
-- First, export your data from Supabase Cloud using these queries:
-- 
-- 1. Export user_profiles:
-- SELECT * FROM user_profiles ORDER BY created_at;
-- 
-- 2. Export programs:
-- SELECT * FROM programs ORDER BY created_at;
-- 
-- 3. Export classes:
-- SELECT * FROM classes ORDER BY created_at;
-- 
-- 4. Export class_trainers:
-- SELECT * FROM class_trainers ORDER BY created_at;
-- 
-- 5. Export participants:
-- SELECT * FROM participants ORDER BY created_at;
-- 
-- 6. Export enrollments:
-- SELECT * FROM enrollments ORDER BY created_at;
-- 
-- 7. Export forum_categories:
-- SELECT * FROM forum_categories ORDER BY created_at;
-- 
-- 8. Export forum_threads:
-- SELECT * FROM forum_threads ORDER BY created_at;
-- 
-- 9. Export forum_replies:
-- SELECT * FROM forum_replies ORDER BY created_at;
-- 
-- 10. Export forum_reactions:
-- SELECT * FROM forum_reactions ORDER BY created_at;
-- 
-- ============================================================================

-- ============================================================================
-- STEP 2: IMPORT DATA TO SELF-HOSTING
-- ============================================================================
-- 
-- Replace the sample data below with your actual exported data
-- Make sure to maintain the same UUIDs for consistency
-- ============================================================================

-- Import user_profiles (replace with your actual data)
/*
INSERT INTO user_profiles (id, email, full_name, role, avatar_url, phone, address, date_of_birth, gender, trainer_level, trainer_experience_years, trainer_specializations, is_active, created_at, updated_at) VALUES
-- Add your user_profiles data here
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    avatar_url = EXCLUDED.avatar_url,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    date_of_birth = EXCLUDED.date_of_birth,
    gender = EXCLUDED.gender,
    trainer_level = EXCLUDED.trainer_level,
    trainer_experience_years = EXCLUDED.trainer_experience_years,
    trainer_specializations = EXCLUDED.trainer_specializations,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
*/

-- Import programs (replace with your actual data)
/*
INSERT INTO programs (id, title, description, category, price, start_date, end_date, max_participants, current_participants, status, trainer_id, whatsapp_group_url, created_at, updated_at) VALUES
-- Add your programs data here
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    max_participants = EXCLUDED.max_participants,
    current_participants = EXCLUDED.current_participants,
    status = EXCLUDED.status,
    trainer_id = EXCLUDED.trainer_id,
    whatsapp_group_url = EXCLUDED.whatsapp_group_url,
    updated_at = NOW();
*/

-- Import classes (replace with your actual data)
/*
INSERT INTO classes (id, program_id, name, description, start_date, end_date, start_time, end_time, max_participants, current_participants, status, location, room, created_at, updated_at) VALUES
-- Add your classes data here
ON CONFLICT (id) DO UPDATE SET
    program_id = EXCLUDED.program_id,
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
*/

-- Import class_trainers (replace with your actual data)
/*
INSERT INTO class_trainers (id, class_id, trainer_id, role, is_primary, created_at) VALUES
-- Add your class_trainers data here
ON CONFLICT (id) DO UPDATE SET
    class_id = EXCLUDED.class_id,
    trainer_id = EXCLUDED.trainer_id,
    role = EXCLUDED.role,
    is_primary = EXCLUDED.is_primary;
*/

-- Import participants (replace with your actual data)
/*
INSERT INTO participants (id, user_id, name, email, phone, address, date_of_birth, gender, emergency_contact_name, emergency_contact_phone, created_at, updated_at) VALUES
-- Add your participants data here
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    date_of_birth = EXCLUDED.date_of_birth,
    gender = EXCLUDED.gender,
    emergency_contact_name = EXCLUDED.emergency_contact_name,
    emergency_contact_phone = EXCLUDED.emergency_contact_phone,
    updated_at = NOW();
*/

-- Import enrollments (replace with your actual data)
/*
INSERT INTO enrollments (id, program_id, class_id, participant_id, status, payment_status, payment_proof_url, notes, enrolled_at, approved_at, created_at, updated_at) VALUES
-- Add your enrollments data here
ON CONFLICT (id) DO UPDATE SET
    program_id = EXCLUDED.program_id,
    class_id = EXCLUDED.class_id,
    participant_id = EXCLUDED.participant_id,
    status = EXCLUDED.status,
    payment_status = EXCLUDED.payment_status,
    payment_proof_url = EXCLUDED.payment_proof_url,
    notes = EXCLUDED.notes,
    enrolled_at = EXCLUDED.enrolled_at,
    approved_at = EXCLUDED.approved_at,
    updated_at = NOW();
*/

-- Import forum_categories (replace with your actual data)
/*
INSERT INTO forum_categories (id, program_id, name, description, order_index, is_active, created_at, updated_at) VALUES
-- Add your forum_categories data here
ON CONFLICT (id) DO UPDATE SET
    program_id = EXCLUDED.program_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    order_index = EXCLUDED.order_index,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
*/

-- Import forum_threads (replace with your actual data)
/*
INSERT INTO forum_threads (id, category_id, author_id, title, content, is_pinned, is_locked, view_count, reply_count, last_reply_at, created_at, updated_at) VALUES
-- Add your forum_threads data here
ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    author_id = EXCLUDED.author_id,
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    is_pinned = EXCLUDED.is_pinned,
    is_locked = EXCLUDED.is_locked,
    view_count = EXCLUDED.view_count,
    reply_count = EXCLUDED.reply_count,
    last_reply_at = EXCLUDED.last_reply_at,
    updated_at = NOW();
*/

-- Import forum_replies (replace with your actual data)
/*
INSERT INTO forum_replies (id, thread_id, author_id, parent_reply_id, content, is_solution, created_at, updated_at) VALUES
-- Add your forum_replies data here
ON CONFLICT (id) DO UPDATE SET
    thread_id = EXCLUDED.thread_id,
    author_id = EXCLUDED.author_id,
    parent_reply_id = EXCLUDED.parent_reply_id,
    content = EXCLUDED.content,
    is_solution = EXCLUDED.is_solution,
    updated_at = NOW();
*/

-- Import forum_reactions (replace with your actual data)
/*
INSERT INTO forum_reactions (id, thread_id, reply_id, user_id, reaction_type, created_at) VALUES
-- Add your forum_reactions data here
ON CONFLICT (id) DO UPDATE SET
    thread_id = EXCLUDED.thread_id,
    reply_id = EXCLUDED.reply_id,
    user_id = EXCLUDED.user_id,
    reaction_type = EXCLUDED.reaction_type;
*/

-- ============================================================================
-- STEP 3: MIGRATE STORAGE FILES
-- ============================================================================
-- 
-- For storage files (payment proofs, avatars, etc.):
-- 1. Download all files from your Supabase Cloud storage
-- 2. Upload them to your self-hosted Supabase storage
-- 3. Update file URLs in the database if needed
-- 
-- You can use the Supabase CLI or API to migrate storage files:
-- 
-- Using Supabase CLI:
-- supabase storage cp supabase://old-project-id/payment-proofs ./local-storage/
-- supabase storage cp ./local-storage/ supabase://new-project-id/payment-proofs
-- 
-- ============================================================================

-- ============================================================================
-- STEP 4: UPDATE FILE URLS (if needed)
-- ============================================================================
-- 
-- If your file URLs changed during migration, update them:
-- 
-- UPDATE user_profiles 
-- SET avatar_url = REPLACE(avatar_url, 'old-domain.com', 'new-domain.com')
-- WHERE avatar_url IS NOT NULL;
-- 
-- UPDATE enrollments 
-- SET payment_proof_url = REPLACE(payment_proof_url, 'old-domain.com', 'new-domain.com')
-- WHERE payment_proof_url IS NOT NULL;
-- 
-- ============================================================================

-- ============================================================================
-- STEP 5: VERIFY MIGRATION
-- ============================================================================

-- Check data counts
SELECT 'user_profiles' as table_name, COUNT(*) as count FROM user_profiles
UNION ALL
SELECT 'programs', COUNT(*) FROM programs
UNION ALL
SELECT 'classes', COUNT(*) FROM classes
UNION ALL
SELECT 'class_trainers', COUNT(*) FROM class_trainers
UNION ALL
SELECT 'participants', COUNT(*) FROM participants
UNION ALL
SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL
SELECT 'forum_categories', COUNT(*) FROM forum_categories
UNION ALL
SELECT 'forum_threads', COUNT(*) FROM forum_threads
UNION ALL
SELECT 'forum_replies', COUNT(*) FROM forum_replies
UNION ALL
SELECT 'forum_reactions', COUNT(*) FROM forum_reactions
ORDER BY table_name;

-- Check for data integrity
SELECT 
    'enrollments_with_invalid_program' as check_name,
    COUNT(*) as count
FROM enrollments e
LEFT JOIN programs p ON e.program_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
    'enrollments_with_invalid_participant',
    COUNT(*)
FROM enrollments e
LEFT JOIN participants p ON e.participant_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
    'classes_with_invalid_program',
    COUNT(*)
FROM classes c
LEFT JOIN programs p ON c.program_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
    'forum_threads_with_invalid_category',
    COUNT(*)
FROM forum_threads ft
LEFT JOIN forum_categories fc ON ft.category_id = fc.id
WHERE fc.id IS NULL;

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
-- 
-- Your data has been successfully migrated to Supabase self-hosting!
-- 
-- Next steps:
-- 1. Update your application's environment variables
-- 2. Test all functionality
-- 3. Update DNS/domain settings if needed
-- 4. Monitor the application for any issues
-- 
-- ============================================================================
