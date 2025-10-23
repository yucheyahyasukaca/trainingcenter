-- =====================================================
-- STEP 1: DROP EXISTING QUIZ POLICIES
-- =====================================================
-- Jalankan script ini terlebih dahulu di Supabase SQL Editor
-- =====================================================

-- Drop existing quiz policies
DROP POLICY IF EXISTS "Admin and trainers manage quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Admin, managers and trainers manage quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Admin and assigned trainers manage quiz questions" ON public.quiz_questions;

DROP POLICY IF EXISTS "Admin and trainers manage quiz options" ON public.quiz_options;
DROP POLICY IF EXISTS "Admin, managers and trainers manage quiz options" ON public.quiz_options;
DROP POLICY IF EXISTS "Admin and assigned trainers manage quiz options" ON public.quiz_options;

-- Drop existing learning contents policies
DROP POLICY IF EXISTS "Admin full access on learning_contents" ON public.learning_contents;
DROP POLICY IF EXISTS "Admin and managers full access on learning_contents" ON public.learning_contents;
DROP POLICY IF EXISTS "Trainer can manage their class contents" ON public.learning_contents;
DROP POLICY IF EXISTS "Assigned trainers can manage their class contents" ON public.learning_contents;

-- Verifikasi policies sudah terhapus
SELECT 'Quiz questions policies dropped' as status;
SELECT 'Quiz options policies dropped' as status;
SELECT 'Learning contents policies dropped' as status;
