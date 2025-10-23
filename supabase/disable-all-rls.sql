-- =====================================================
-- DISABLE ALL RLS FOR DEBUGGING
-- =====================================================
-- Jalankan script ini untuk menonaktifkan semua RLS
-- =====================================================

-- Disable RLS on all tables
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_trainers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_contents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments DISABLE ROW LEVEL SECURITY;

-- Verifikasi semua RLS disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'user_profiles', 'programs', 'classes', 'class_trainers', 
    'trainers', 'learning_contents', 'quiz_questions', 'quiz_options',
    'participants', 'enrollments'
)
ORDER BY tablename;
