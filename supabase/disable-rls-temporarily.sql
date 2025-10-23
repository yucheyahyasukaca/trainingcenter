-- =====================================================
-- DISABLE RLS TEMPORARILY FOR DEBUGGING
-- =====================================================
-- Jalankan script ini untuk menonaktifkan RLS sementara
-- =====================================================

-- Disable RLS on learning_contents temporarily
ALTER TABLE public.learning_contents DISABLE ROW LEVEL SECURITY;

-- Disable RLS on quiz_questions temporarily  
ALTER TABLE public.quiz_questions DISABLE ROW LEVEL SECURITY;

-- Disable RLS on quiz_options temporarily
ALTER TABLE public.quiz_options DISABLE ROW LEVEL SECURITY;

-- Disable RLS on class_trainers temporarily
ALTER TABLE public.class_trainers DISABLE ROW LEVEL SECURITY;

-- Disable RLS on trainers temporarily
ALTER TABLE public.trainers DISABLE ROW LEVEL SECURITY;

-- Verifikasi RLS disabled
SELECT 'RLS disabled temporarily for debugging' as status;
