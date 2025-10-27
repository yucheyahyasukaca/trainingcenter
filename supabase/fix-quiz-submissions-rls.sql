-- ============================================================================
-- FIX QUIZ SUBMISSIONS RLS POLICIES
-- ============================================================================
-- This script creates RLS policies for quiz_submissions table
-- 
-- ⚠️ IMPORTANT: Run this AFTER creating the table!
-- First run: create-quiz-submissions-table.sql
-- Then run: fix-quiz-submissions-rls.sql (this file)
-- ============================================================================

-- Check if table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'quiz_submissions'
    ) THEN
        RAISE EXCEPTION 'Table quiz_submissions does not exist! Please run create-quiz-submissions-table.sql first.';
    END IF;
END $$;

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can submit quiz answers" ON public.quiz_submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.quiz_submissions;
DROP POLICY IF EXISTS "Trainers can view submissions for their classes" ON public.quiz_submissions;
DROP POLICY IF EXISTS "Admin can manage all submissions" ON public.quiz_submissions;

-- Enable RLS (should already be enabled, but just in case)
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY 1: Users can submit their own quiz answers
-- ============================================================================
CREATE POLICY "Users can submit quiz answers"
ON public.quiz_submissions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- POLICY 2: Users can view their own quiz submissions
-- ============================================================================
CREATE POLICY "Users can view their own submissions"
ON public.quiz_submissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- POLICY 3: Users can update their own submissions (for retakes, corrections, etc.)
-- ============================================================================
CREATE POLICY "Users can update their own submissions"
ON public.quiz_submissions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- POLICY 4: Trainers can view all submissions for content in their classes
-- ============================================================================
CREATE POLICY "Trainers can view submissions for their classes"
ON public.quiz_submissions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.learning_contents lc
        JOIN public.classes c ON lc.class_id = c.id
        WHERE lc.id = quiz_submissions.content_id
        AND (
            -- Check if user is assigned as trainer for this class
            EXISTS (
                SELECT 1 FROM public.class_trainers ct
                WHERE ct.class_id = c.id
                AND ct.trainer_id::text = auth.uid()::text
            )
            OR
            -- Check if user is the program trainer
            EXISTS (
                SELECT 1 FROM public.programs p
                WHERE p.id = c.program_id
                AND p.trainer_id::text = auth.uid()::text
            )
        )
    )
    OR
    -- Allow if user has trainer role
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = auth.uid()
        AND up.role = 'trainer'
    )
);

-- ============================================================================
-- POLICY 5: Admin can view all submissions
-- ============================================================================
CREATE POLICY "Admin can manage all submissions"
ON public.quiz_submissions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- ============================================================================
-- VERIFY POLICIES
-- ============================================================================
-- Run this to verify the policies were created:
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename = 'quiz_submissions'
ORDER BY policyname;

-- ============================================================================
-- GRANT PERMISSIONS (if needed)
-- ============================================================================
GRANT ALL ON public.quiz_submissions TO authenticated;

-- Test query (run as a regular user to verify):
-- SELECT * FROM public.quiz_submissions;

