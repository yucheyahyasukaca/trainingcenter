-- ============================================================================
-- FIX ASSIGNMENT SUBMISSIONS RLS POLICIES
-- ============================================================================
-- This script creates RLS policies for assignment_submissions table
-- 
-- ⚠️ IMPORTANT: Run this AFTER creating the table!
-- First run: create-assignment-submissions-table.sql
-- Then run: fix-assignment-submissions-rls.sql (this file)
-- ============================================================================

-- Check if table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'assignment_submissions'
    ) THEN
        RAISE EXCEPTION 'Table assignment_submissions does not exist! Please run create-assignment-submissions-table.sql first.';
    END IF;
END $$;

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can submit assignments" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Trainers can view submissions for their classes" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Trainers can grade submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Admin can manage all submissions" ON public.assignment_submissions;

-- Enable RLS (should already be enabled, but just in case)
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY 1: Users can submit their own assignments
-- ============================================================================
CREATE POLICY "Users can submit assignments"
ON public.assignment_submissions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- POLICY 2: Users can view their own assignment submissions
-- ============================================================================
CREATE POLICY "Users can view their own submissions"
ON public.assignment_submissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- POLICY 3: Users can update their own submissions (before grading)
-- ============================================================================
CREATE POLICY "Users can update their own submissions"
ON public.assignment_submissions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'submitted')
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- POLICY 4: Trainers can view all submissions for content in their classes
-- ============================================================================
CREATE POLICY "Trainers can view submissions for their classes"
ON public.assignment_submissions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.learning_contents lc
        JOIN public.classes c ON lc.class_id = c.id
        WHERE lc.id = assignment_submissions.content_id
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
-- POLICY 5: Trainers can grade assignments
-- ============================================================================
CREATE POLICY "Trainers can grade submissions"
ON public.assignment_submissions
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.learning_contents lc
        JOIN public.classes c ON lc.class_id = c.id
        WHERE lc.id = assignment_submissions.content_id
        AND (
            EXISTS (
                SELECT 1 FROM public.class_trainers ct
                WHERE ct.class_id = c.id
                AND ct.trainer_id::text = auth.uid()::text
            )
            OR
            EXISTS (
                SELECT 1 FROM public.programs p
                WHERE p.id = c.program_id
                AND p.trainer_id::text = auth.uid()::text
            )
        )
    )
    OR
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = auth.uid()
        AND up.role = 'trainer'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.learning_contents lc
        JOIN public.classes c ON lc.class_id = c.id
        WHERE lc.id = assignment_submissions.content_id
        AND (
            EXISTS (
                SELECT 1 FROM public.class_trainers ct
                WHERE ct.class_id = c.id
                AND ct.trainer_id::text = auth.uid()::text
            )
            OR
            EXISTS (
                SELECT 1 FROM public.programs p
                WHERE p.id = c.program_id
                AND p.trainer_id::text = auth.uid()::text
            )
        )
    )
    OR
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = auth.uid()
        AND up.role = 'trainer'
    )
);

-- ============================================================================
-- POLICY 6: Admin can manage all submissions
-- ============================================================================
CREATE POLICY "Admin can manage all submissions"
ON public.assignment_submissions
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
WHERE tablename = 'assignment_submissions'
ORDER BY policyname;

-- ============================================================================
-- GRANT PERMISSIONS (if needed)
-- ============================================================================
GRANT ALL ON public.assignment_submissions TO authenticated;

