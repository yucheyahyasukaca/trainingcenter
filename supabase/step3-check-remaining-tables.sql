-- =====================================================
-- STEP 3 CHECK: CHECK REMAINING TABLES
-- =====================================================
-- Jalankan script ini untuk cek tabel yang tersisa
-- =====================================================

-- Cek quiz_questions
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_questions') 
        THEN 'quiz_questions table EXISTS'
        ELSE 'quiz_questions table NOT EXISTS'
    END as status;

-- Cek quiz_options
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_options') 
        THEN 'quiz_options table EXISTS'
        ELSE 'quiz_options table NOT EXISTS'
    END as status;

-- Cek learning_contents
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_contents') 
        THEN 'learning_contents table EXISTS'
        ELSE 'learning_contents table NOT EXISTS'
    END as status;

-- Cek class_trainers
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_trainers') 
        THEN 'class_trainers table EXISTS'
        ELSE 'class_trainers table NOT EXISTS'
    END as status;
