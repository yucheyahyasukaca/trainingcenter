-- =====================================================
-- FIX QUIZ ACCESS POLICIES
-- =====================================================
-- This script updates the quiz policies to include managers
-- and fixes access control issues
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admin and trainers manage quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Admin and trainers manage quiz options" ON public.quiz_options;

-- Create updated policies for admin and assigned trainers only
CREATE POLICY "Admin and assigned trainers manage quiz questions"
ON public.quiz_questions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
    OR EXISTS (
        SELECT 1 FROM public.learning_contents lc
        JOIN public.classes c ON lc.class_id = c.id
        JOIN public.programs p ON c.program_id = p.id
        WHERE lc.id = quiz_questions.content_id
        AND p.trainer_id::text = auth.uid()::text
    )
    OR EXISTS (
        SELECT 1 FROM public.learning_contents lc
        JOIN public.classes c ON lc.class_id = c.id
        JOIN public.class_trainers ct ON c.id = ct.class_id
        JOIN public.trainers t ON ct.trainer_id = t.id
        WHERE lc.id = quiz_questions.content_id
        AND t.user_id = auth.uid()
    )
);

CREATE POLICY "Admin and assigned trainers manage quiz options"
ON public.quiz_options
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
    OR EXISTS (
        SELECT 1 FROM public.quiz_questions qq
        JOIN public.learning_contents lc ON qq.content_id = lc.id
        JOIN public.classes c ON lc.class_id = c.id
        JOIN public.programs p ON c.program_id = p.id
        WHERE qq.id = quiz_options.question_id
        AND p.trainer_id::text = auth.uid()::text
    )
    OR EXISTS (
        SELECT 1 FROM public.quiz_questions qq
        JOIN public.learning_contents lc ON qq.content_id = lc.id
        JOIN public.classes c ON lc.class_id = c.id
        JOIN public.class_trainers ct ON c.id = ct.class_id
        JOIN public.trainers t ON ct.trainer_id = t.id
        WHERE qq.id = quiz_options.question_id
        AND t.user_id = auth.uid()
    )
);

-- Also update learning contents policies for admin and assigned trainers only
DROP POLICY IF EXISTS "Admin full access on learning_contents" ON public.learning_contents;
DROP POLICY IF EXISTS "Trainer can manage their class contents" ON public.learning_contents;

CREATE POLICY "Admin full access on learning_contents"
ON public.learning_contents
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

CREATE POLICY "Assigned trainers can manage their class contents"
ON public.learning_contents
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.classes c
        JOIN public.programs p ON c.program_id = p.id
        WHERE c.id = learning_contents.class_id
        AND p.trainer_id::text = auth.uid()::text
    )
    OR EXISTS (
        SELECT 1 FROM public.classes c
        JOIN public.class_trainers ct ON c.id = ct.class_id
        JOIN public.trainers t ON ct.trainer_id = t.id
        WHERE c.id = learning_contents.class_id
        AND t.user_id = auth.uid()
    )
);
