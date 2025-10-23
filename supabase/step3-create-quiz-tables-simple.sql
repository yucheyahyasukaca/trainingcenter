-- =====================================================
-- STEP 3 CREATE: CREATE QUIZ TABLES (SIMPLIFIED)
-- =====================================================
-- Jalankan script ini untuk membuat tabel quiz dengan cara yang lebih sederhana
-- =====================================================

-- Create quiz_questions table (simplified)
CREATE TABLE public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    content_id UUID NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    order_index INTEGER DEFAULT 0,
    points INTEGER DEFAULT 1,
    explanation TEXT,
    correct_answer TEXT
);

-- Create quiz_options table (simplified)
CREATE TABLE public.quiz_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    question_id UUID NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0
);

-- Add foreign key constraints after table creation
ALTER TABLE public.quiz_questions 
ADD CONSTRAINT quiz_questions_content_id_fkey 
FOREIGN KEY (content_id) REFERENCES public.learning_contents(id) ON DELETE CASCADE;

ALTER TABLE public.quiz_options 
ADD CONSTRAINT quiz_options_question_id_fkey 
FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON DELETE CASCADE;

-- Add check constraints
ALTER TABLE public.quiz_questions 
ADD CONSTRAINT quiz_questions_type_check 
CHECK (question_type IN ('multiple_choice', 'true_false', 'essay', 'short_answer'));

-- Create indexes
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
