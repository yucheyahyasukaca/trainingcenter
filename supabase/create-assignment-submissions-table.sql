-- ============================================================================
-- CREATE ASSIGNMENT SUBMISSIONS TABLE
-- ============================================================================
-- This script creates the assignment_submissions table
-- Run this FIRST before running fix-assignment-submissions-rls.sql
-- ============================================================================

-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Relations
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.learning_contents(id) ON DELETE CASCADE,
    
    -- Submission Data
    answer_text TEXT, -- Text answer
    file_url TEXT, -- URL to uploaded file
    
    -- Grading
    score INTEGER,
    max_score INTEGER,
    graded_by UUID REFERENCES auth.users(id), -- trainer who graded
    graded_at TIMESTAMPTZ,
    feedback TEXT, -- trainer's feedback
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'rejected', 'revision_requested')),
    
    -- Attempt tracking
    attempt_number INTEGER DEFAULT 1,
    
    -- Unique constraint: one submission per user per content per attempt
    CONSTRAINT assignment_submissions_unique UNIQUE (user_id, content_id, attempt_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user_id ON public.assignment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_content_id ON public.assignment_submissions(content_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user_content ON public.assignment_submissions(user_id, content_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_assignment_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_assignment_submissions_updated_at ON public.assignment_submissions;
CREATE TRIGGER trigger_update_assignment_submissions_updated_at
BEFORE UPDATE ON public.assignment_submissions
FOR EACH ROW
EXECUTE FUNCTION update_assignment_submissions_updated_at();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT ALL ON public.assignment_submissions TO authenticated;

-- ============================================================================
-- VERIFY TABLE CREATION
-- ============================================================================
-- Run this to verify the table was created:
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'assignment_submissions'
ORDER BY ordinal_position;

