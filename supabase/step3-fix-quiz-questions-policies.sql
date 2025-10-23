-- =====================================================
-- STEP 3 FIX: CREATE QUIZ QUESTIONS POLICIES (SIMPLIFIED)
-- =====================================================
-- Jalankan script ini untuk memperbaiki error di Step 3
-- =====================================================

-- Drop policy yang mungkin error
DROP POLICY IF EXISTS "Admin and assigned trainers manage quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Users view quiz questions" ON public.quiz_questions;

-- Policy 1: Admin can manage all quiz questions
CREATE POLICY "Admin manage quiz questions"
ON public.quiz_questions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- Policy 2: Trainers can manage quiz questions for their programs
CREATE POLICY "Trainers manage quiz questions for their programs"
ON public.quiz_questions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.learning_contents lc
        JOIN public.classes c ON lc.class_id = c.id
        JOIN public.programs p ON c.program_id = p.id
        WHERE lc.id = quiz_questions.content_id
        AND p.trainer_id::text = auth.uid()::text
    )
);

-- Policy 3: Assigned trainers can manage quiz questions for their classes
CREATE POLICY "Assigned trainers manage quiz questions for their classes"
ON public.quiz_questions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.learning_contents lc
        JOIN public.classes c ON lc.class_id = c.id
        JOIN public.class_trainers ct ON c.id = ct.class_id
        JOIN public.trainers t ON ct.trainer_id = t.id
        WHERE lc.id = quiz_questions.content_id
        AND t.user_id = auth.uid()
    )
);

-- Policy 4: Users can view quiz questions for enrolled classes
CREATE POLICY "Users view quiz questions for enrolled classes"
ON public.quiz_questions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.learning_contents lc
        JOIN public.classes c ON lc.class_id = c.id
        JOIN public.enrollments e ON c.id = e.class_id
        WHERE lc.id = quiz_questions.content_id
        AND e.participant_id = auth.uid()
        AND e.status = 'approved'
        AND lc.status = 'published'
    )
);

-- Verifikasi policies berhasil dibuat
SELECT 'Quiz questions policies created successfully' as status;
