-- =====================================================
-- STEP 3 CHECK: CHECK QUIZ TABLES ONLY
-- =====================================================
-- Jalankan script ini untuk cek tabel quiz saja
-- =====================================================

-- Cek quiz_questions
SELECT 'quiz_questions' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_questions') 
        THEN 'EXISTS'
        ELSE 'NOT EXISTS'
    END as status;

-- Cek quiz_options
SELECT 'quiz_options' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_options') 
        THEN 'EXISTS'
        ELSE 'NOT EXISTS'
    END as status;
