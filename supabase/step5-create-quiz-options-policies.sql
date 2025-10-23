-- =====================================================
-- STEP 5: CREATE QUIZ OPTIONS POLICIES
-- =====================================================
-- Jalankan script ini setelah Step 4 berhasil
-- =====================================================

-- Policy 1: Admin can manage all quiz options
CREATE POLICY "Admin manage quiz options"
ON public.quiz_options
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- Policy 2: Trainers can manage quiz options for their programs
CREATE POLICY "Trainers manage quiz options for their programs"
ON public.quiz_options
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quiz_questions qq
        JOIN public.learning_contents lc ON qq.content_id = lc.id
        JOIN public.classes c ON lc.class_id = c.id
        JOIN public.programs p ON c.program_id = p.id
        WHERE qq.id = quiz_options.question_id
        AND p.trainer_id::text = auth.uid()::text
    )
);

-- Policy 3: Assigned trainers can manage quiz options for their classes
CREATE POLICY "Assigned trainers manage quiz options for their classes"
ON public.quiz_options
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quiz_questions qq
        JOIN public.learning_contents lc ON qq.content_id = lc.id
        JOIN public.classes c ON lc.class_id = c.id
        JOIN public.class_trainers ct ON c.id = ct.class_id
        JOIN public.trainers t ON ct.trainer_id = t.id
        WHERE qq.id = quiz_options.question_id
        AND t.user_id = auth.uid()
    )
);

-- Policy 4: Users can view quiz options for enrolled classes
CREATE POLICY "Users view quiz options for enrolled classes"
ON public.quiz_options
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quiz_questions qq
        JOIN public.learning_contents lc ON qq.content_id = lc.id
        JOIN public.classes c ON lc.class_id = c.id
        JOIN public.enrollments e ON c.id = e.class_id
        WHERE qq.id = quiz_options.question_id
        AND e.participant_id = auth.uid()
        AND e.status = 'approved'
        AND lc.status = 'published'
    )
);

-- Verifikasi policies berhasil dibuat
SELECT 'Quiz options policies created successfully' as status;
