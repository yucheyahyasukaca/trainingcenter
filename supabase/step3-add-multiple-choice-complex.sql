-- =====================================================
-- STEP 3 ADD: ADD MULTIPLE CHOICE COMPLEX SUPPORT
-- =====================================================
-- Jalankan script ini untuk menambahkan dukungan pilihan ganda kompleks
-- =====================================================

-- Tambahkan kolom untuk mendukung multiple correct answers
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS allow_multiple_correct BOOLEAN DEFAULT false;

-- Update constraint untuk mendukung multiple choice complex
ALTER TABLE public.quiz_questions 
DROP CONSTRAINT IF EXISTS quiz_questions_type_check;

ALTER TABLE public.quiz_questions 
ADD CONSTRAINT quiz_questions_type_check 
CHECK (question_type IN ('multiple_choice', 'multiple_choice_complex', 'true_false', 'essay', 'short_answer'));

-- Update question_type yang sudah ada untuk multiple_choice_complex
-- (Ini opsional, bisa diabaikan jika belum ada data)
-- UPDATE public.quiz_questions 
-- SET question_type = 'multiple_choice_complex' 
-- WHERE question_type = 'multiple_choice' AND allow_multiple_correct = true;

-- Verifikasi perubahan berhasil
SELECT 'Multiple choice complex support added successfully' as status;
