-- ============================================================================
-- CREATE QUIZ SUBMISSIONS TABLE
-- ============================================================================
-- This script creates the quiz_submissions table
-- Run this FIRST before running fix-quiz-submissions-rls.sql
-- ============================================================================

-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS public.quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Relations
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.learning_contents(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    
    -- Answer Data
    selected_option_id UUID REFERENCES public.quiz_options(id), -- for multiple choice
    answer_text TEXT, -- for essay/short answer
    
    -- Grading
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    graded_by UUID REFERENCES auth.users(id), -- trainer who graded (for manual grading)
    graded_at TIMESTAMPTZ,
    feedback TEXT, -- trainer's feedback
    
    -- Attempt tracking
    attempt_number INTEGER DEFAULT 1,
    
    CONSTRAINT quiz_submissions_option_id_fkey FOREIGN KEY (selected_option_id) 
        REFERENCES public.quiz_options(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user_id ON public.quiz_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_content_id ON public.quiz_submissions(content_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_question_id ON public.quiz_submissions(question_id);

-- ============================================================================
-- CREATE AUTO-GRADING TRIGGER (Optional)
-- ============================================================================

-- Function to auto-grade quiz submissions
CREATE OR REPLACE FUNCTION auto_grade_quiz()
RETURNS TRIGGER AS $$
DECLARE
    correct BOOLEAN;
    question_points INTEGER;
BEGIN
    -- Only auto-grade if option is selected
    IF NEW.selected_option_id IS NOT NULL THEN
        -- Check if answer is correct
        SELECT qo.is_correct INTO correct
        FROM public.quiz_options qo
        WHERE qo.id = NEW.selected_option_id;
        
        -- Get question points
        SELECT qq.points INTO question_points
        FROM public.quiz_questions qq
        WHERE qq.id = NEW.question_id;
        
        -- Update submission
        NEW.is_correct := correct;
        NEW.points_earned := CASE WHEN correct THEN question_points ELSE 0 END;
        NEW.graded_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-grade
DROP TRIGGER IF EXISTS trigger_auto_grade_quiz ON public.quiz_submissions;
CREATE TRIGGER trigger_auto_grade_quiz
BEFORE INSERT OR UPDATE ON public.quiz_submissions
FOR EACH ROW
EXECUTE FUNCTION auto_grade_quiz();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT ALL ON public.quiz_submissions TO authenticated;

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
AND table_name = 'quiz_submissions'
ORDER BY ordinal_position;

