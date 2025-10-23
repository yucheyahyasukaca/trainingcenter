-- =====================================================
-- STEP 3 CHECK: CHECK AND CREATE QUIZ TABLES
-- =====================================================
-- Jalankan script ini untuk cek apakah tabel quiz sudah ada
-- =====================================================

-- Cek apakah tabel quiz_questions sudah ada
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_questions') 
        THEN 'quiz_questions table EXISTS'
        ELSE 'quiz_questions table NOT EXISTS'
    END as quiz_questions_status;

-- Cek apakah tabel quiz_options sudah ada
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_options') 
        THEN 'quiz_options table EXISTS'
        ELSE 'quiz_options table NOT EXISTS'
    END as quiz_options_status;

-- Cek apakah tabel learning_contents sudah ada
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_contents') 
        THEN 'learning_contents table EXISTS'
        ELSE 'learning_contents table NOT EXISTS'
    END as learning_contents_status;

-- Cek apakah tabel class_trainers sudah ada
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_trainers') 
        THEN 'class_trainers table EXISTS'
        ELSE 'class_trainers table NOT EXISTS'
    END as class_trainers_status;

-- Cek apakah tabel trainers sudah ada
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trainers') 
        THEN 'trainers table EXISTS'
        ELSE 'trainers table NOT EXISTS'
    END as trainers_status;
