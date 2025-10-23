-- =====================================================
-- STEP 3 CREATE: CREATE QUIZ TABLES
-- =====================================================
-- Jalankan script ini untuk membuat tabel quiz
-- =====================================================

-- Create quiz_questions table
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

-- Create quiz_options table
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

-- Create indexes for performance
CREATE INDEX idx_quiz_questions_content_id ON public.quiz_questions(content_id);
CREATE INDEX idx_quiz_questions_order ON public.quiz_questions(content_id, order_index);
CREATE INDEX idx_quiz_options_question_id ON public.quiz_options(question_id);

-- Enable RLS
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_options TO authenticated;

-- Verifikasi tabel berhasil dibuat
SELECT 'Quiz tables created successfully' as status;
