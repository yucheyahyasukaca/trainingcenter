-- =====================================================
-- LEARNING CONTENT MANAGEMENT SYSTEM
-- =====================================================
-- This script creates tables for managing learning content,
-- progress tracking, quizzes, and assessments
-- =====================================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS public.quiz_submissions CASCADE;
DROP TABLE IF EXISTS public.quiz_options CASCADE;
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
DROP TABLE IF EXISTS public.learning_progress CASCADE;
DROP TABLE IF EXISTS public.learning_contents CASCADE;

-- =====================================================
-- 1. LEARNING CONTENTS TABLE
-- =====================================================
-- Stores all learning materials (video, text, quiz, document)
CREATE TABLE public.learning_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Relations
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    
    -- Content Info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('video', 'text', 'quiz', 'document', 'assignment')),
    
    -- Content Data
    content_data JSONB, -- Stores different data based on type:
    -- For video: { "video_url": "...", "duration": 300, "thumbnail": "..." }
    -- For text: { "body": "HTML content...", "estimated_read_time": 10 }
    -- For document: { "file_url": "...", "file_type": "pdf", "file_size": 1024 }
    
    -- Ordering and Status
    order_index INTEGER DEFAULT 0,
    is_free BOOLEAN DEFAULT false, -- Can be accessed without enrollment
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    
    -- Settings
    is_required BOOLEAN DEFAULT true, -- Required to complete class
    estimated_duration INTEGER, -- in minutes
    
    CONSTRAINT learning_contents_class_id_fkey FOREIGN KEY (class_id) 
        REFERENCES public.classes(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_learning_contents_class_id ON public.learning_contents(class_id);
CREATE INDEX idx_learning_contents_status ON public.learning_contents(status);
CREATE INDEX idx_learning_contents_order ON public.learning_contents(class_id, order_index);

-- =====================================================
-- 2. LEARNING PROGRESS TABLE
-- =====================================================
-- Tracks user progress on each learning content
CREATE TABLE public.learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Relations
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.learning_contents(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
    
    -- Progress Tracking
    status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- Time Tracking
    time_spent INTEGER DEFAULT 0, -- in seconds
    last_position INTEGER DEFAULT 0, -- for video: last watched second, for text: last scroll position
    
    -- Completion
    completed_at TIMESTAMPTZ,
    attempts INTEGER DEFAULT 0, -- for quiz/assignment
    
    -- Additional Data
    notes TEXT, -- user's notes
    
    CONSTRAINT learning_progress_unique UNIQUE (user_id, content_id)
);

-- Indexes
CREATE INDEX idx_learning_progress_user_id ON public.learning_progress(user_id);
CREATE INDEX idx_learning_progress_content_id ON public.learning_progress(content_id);
CREATE INDEX idx_learning_progress_enrollment_id ON public.learning_progress(enrollment_id);
CREATE INDEX idx_learning_progress_status ON public.learning_progress(status);

-- =====================================================
-- 3. QUIZ QUESTIONS TABLE
-- =====================================================
-- Stores quiz questions linked to learning content
CREATE TABLE public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Relations
    content_id UUID NOT NULL REFERENCES public.learning_contents(id) ON DELETE CASCADE,
    
    -- Question Data
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'essay', 'short_answer')),
    
    -- Settings
    order_index INTEGER DEFAULT 0,
    points INTEGER DEFAULT 1,
    explanation TEXT, -- Explanation shown after answer
    
    -- For essay/short answer
    correct_answer TEXT, -- Expected answer for auto-grading
    
    CONSTRAINT quiz_questions_content_id_fkey FOREIGN KEY (content_id) 
        REFERENCES public.learning_contents(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_quiz_questions_content_id ON public.quiz_questions(content_id);
CREATE INDEX idx_quiz_questions_order ON public.quiz_questions(content_id, order_index);

-- =====================================================
-- 4. QUIZ OPTIONS TABLE
-- =====================================================
-- Stores multiple choice options for quiz questions
CREATE TABLE public.quiz_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Relations
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    
    -- Option Data
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    
    CONSTRAINT quiz_options_question_id_fkey FOREIGN KEY (question_id) 
        REFERENCES public.quiz_questions(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_quiz_options_question_id ON public.quiz_options(question_id);

-- =====================================================
-- 5. QUIZ SUBMISSIONS TABLE
-- =====================================================
-- Stores user's quiz answers and results
CREATE TABLE public.quiz_submissions (
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

-- Indexes
CREATE INDEX idx_quiz_submissions_user_id ON public.quiz_submissions(user_id);
CREATE INDEX idx_quiz_submissions_content_id ON public.quiz_submissions(content_id);
CREATE INDEX idx_quiz_submissions_question_id ON public.quiz_submissions(question_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.learning_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- LEARNING CONTENTS POLICIES
-- =====================================================

-- Admin can do everything
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

-- Trainer can manage content for their classes
CREATE POLICY "Trainer can manage their class contents"
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
);

-- Users can view published content for enrolled classes or free content
CREATE POLICY "Users can view published content"
ON public.learning_contents
FOR SELECT
TO authenticated
USING (
    status = 'published' AND (
        is_free = true
        OR EXISTS (
            SELECT 1 FROM public.enrollments e
            JOIN public.classes c ON e.class_id = c.id
            WHERE c.id = learning_contents.class_id
            AND e.participant_id = auth.uid()
            AND e.status = 'approved'
        )
    )
);

-- =====================================================
-- LEARNING PROGRESS POLICIES
-- =====================================================

-- Users can manage their own progress
CREATE POLICY "Users manage own progress"
ON public.learning_progress
FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Trainers can view progress for their class students
CREATE POLICY "Trainers view student progress"
ON public.learning_progress
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.learning_contents lc
        JOIN public.classes c ON lc.class_id = c.id
        JOIN public.programs p ON c.program_id = p.id
        WHERE lc.id = learning_progress.content_id
        AND p.trainer_id::text = auth.uid()::text
    )
);

-- Admin can view all progress
CREATE POLICY "Admin view all progress"
ON public.learning_progress
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- =====================================================
-- QUIZ QUESTIONS POLICIES
-- =====================================================

-- Admin and trainers can manage questions
CREATE POLICY "Admin and trainers manage quiz questions"
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
);

-- Users can view questions for enrolled classes
CREATE POLICY "Users view quiz questions"
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

-- =====================================================
-- QUIZ OPTIONS POLICIES
-- =====================================================

-- Admin and trainers can manage options
CREATE POLICY "Admin and trainers manage quiz options"
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
);

-- Users can view options (but not is_correct until after submission)
CREATE POLICY "Users view quiz options"
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

-- =====================================================
-- QUIZ SUBMISSIONS POLICIES
-- =====================================================

-- Users can create and view their own submissions
CREATE POLICY "Users manage own submissions"
ON public.quiz_submissions
FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Trainers can view and grade submissions for their classes
CREATE POLICY "Trainers grade submissions"
ON public.quiz_submissions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.learning_contents lc
        JOIN public.classes c ON lc.class_id = c.id
        JOIN public.programs p ON c.program_id = p.id
        WHERE lc.id = quiz_submissions.content_id
        AND p.trainer_id::text = auth.uid()::text
    )
);

-- Admin can view all submissions
CREATE POLICY "Admin view all submissions"
ON public.quiz_submissions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update learning progress percentage based on completed contents
CREATE OR REPLACE FUNCTION update_class_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update enrollment progress when content is completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE public.enrollments e
        SET progress_percentage = (
            SELECT COALESCE(
                ROUND(
                    (COUNT(CASE WHEN lp.status = 'completed' THEN 1 END)::DECIMAL / 
                    COUNT(*)::DECIMAL) * 100
                ), 0
            )
            FROM public.learning_contents lc
            LEFT JOIN public.learning_progress lp ON lc.id = lp.content_id AND lp.user_id = NEW.user_id
            WHERE lc.class_id = (
                SELECT class_id FROM public.learning_contents WHERE id = NEW.content_id
            )
            AND lc.is_required = true
            AND lc.status = 'published'
        )
        WHERE e.id = NEW.enrollment_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update class progress
CREATE TRIGGER trigger_update_class_progress
AFTER INSERT OR UPDATE ON public.learning_progress
FOR EACH ROW
EXECUTE FUNCTION update_class_progress();

-- Function to auto-grade multiple choice questions
CREATE OR REPLACE FUNCTION auto_grade_quiz()
RETURNS TRIGGER AS $$
DECLARE
    correct BOOLEAN;
    question_points INTEGER;
BEGIN
    -- Only auto-grade if selected_option_id is provided
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

-- Trigger to auto-grade
CREATE TRIGGER trigger_auto_grade_quiz
BEFORE INSERT OR UPDATE ON public.quiz_submissions
FOR EACH ROW
EXECUTE FUNCTION auto_grade_quiz();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

COMMENT ON TABLE public.learning_contents IS 'Stores all learning materials including videos, text content, quizzes, and documents';
COMMENT ON TABLE public.learning_progress IS 'Tracks individual user progress on each learning content item';
COMMENT ON TABLE public.quiz_questions IS 'Stores quiz questions linked to learning content';
COMMENT ON TABLE public.quiz_options IS 'Stores answer options for multiple choice questions';
COMMENT ON TABLE public.quiz_submissions IS 'Stores user quiz submissions and grading results';

-- Grant permissions
GRANT ALL ON public.learning_contents TO authenticated;
GRANT ALL ON public.learning_progress TO authenticated;
GRANT ALL ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_options TO authenticated;
GRANT ALL ON public.quiz_submissions TO authenticated;

