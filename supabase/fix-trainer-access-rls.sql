-- =====================================================
-- FIX: RELAX RLS POLICIES FOR TRAINER ACCESS
-- =====================================================
-- Jalankan script ini untuk memperbaiki akses trainer
-- =====================================================

-- Drop existing policies yang mungkin terlalu ketat
DROP POLICY IF EXISTS "Admin manage quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Trainers manage quiz questions for their programs" ON public.quiz_questions;
DROP POLICY IF EXISTS "Assigned trainers manage quiz questions for their classes" ON public.quiz_questions;
DROP POLICY IF EXISTS "Users view quiz questions for enrolled classes" ON public.quiz_questions;

DROP POLICY IF EXISTS "Admin manage quiz options" ON public.quiz_options;
DROP POLICY IF EXISTS "Trainers manage quiz options for their programs" ON public.quiz_options;
DROP POLICY IF EXISTS "Assigned trainers manage quiz options for their classes" ON public.quiz_options;
DROP POLICY IF EXISTS "Users view quiz options for enrolled classes" ON public.quiz_options;

-- Create simplified policies untuk sementara
CREATE POLICY "Allow all authenticated users to manage quiz questions"
ON public.quiz_questions
FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow all authenticated users to manage quiz options"
ON public.quiz_options
FOR ALL
TO authenticated
USING (true);

-- Verifikasi policies berhasil dibuat
SELECT 'RLS policies relaxed for debugging' as status;
