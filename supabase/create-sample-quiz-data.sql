-- =====================================================
-- SAMPLE QUIZ DATA FOR LEARNING CONTENT
-- =====================================================
-- This script creates sample quiz content for testing
-- Run this after creating classes and learning_contents

-- First, let's create a sample learning content with quiz type
-- You need to replace the class_id with an actual class ID from your database

-- Get the first class ID (adjust this query based on your data)
-- DO block to set the class_id variable
DO $$
DECLARE
    v_class_id UUID;
    v_content_id UUID;
    v_question_id1 UUID;
    v_question_id2 UUID;
    v_question_id3 UUID;
    v_option_id1 UUID;
    v_option_id2 UUID;
    v_option_id3 UUID;
    v_option_id4 UUID;
    v_option_id5 UUID;
    v_option_id6 UUID;
    v_option_id7 UUID;
    v_option_id8 UUID;
    v_option_id9 UUID;
    v_option_id10 UUID;
    v_option_id11 UUID;
    v_option_id12 UUID;
BEGIN
    -- Get first class ID
    SELECT id INTO v_class_id FROM classes ORDER BY created_at LIMIT 1;
    
    IF v_class_id IS NULL THEN
        RAISE NOTICE 'No class found. Please create classes first.';
        RETURN;
    END IF;

    RAISE NOTICE 'Using class_id: %', v_class_id;

    -- Create Quiz Learning Content
    INSERT INTO public.learning_contents (
        id,
        class_id,
        title,
        description,
        content_type,
        content_data,
        order_index,
        is_free,
        status,
        is_required,
        estimated_duration,
        created_at,
        updated_at
    ) VALUES (
        'quiz-content-001',
        v_class_id,
        'Quiz: Konsep Dasar Pembelajaran',
        'Quiz untuk menguji pemahaman konsep dasar yang telah dipelajari',
        'quiz',
        '{"passing_score": 75}'::jsonb,
        3, -- Set order as needed
        false,
        'published',
        true,
        30, -- 30 minutes estimated
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        updated_at = NOW()
    RETURNING id INTO v_content_id;

    RAISE NOTICE 'Created quiz content with id: %', v_content_id;

    -- Question 1: Multiple Choice
    INSERT INTO public.quiz_questions (
        id,
        content_id,
        question_text,
        question_type,
        order_index,
        points,
        explanation,
        created_at,
        updated_at
    ) VALUES (
        'quiz-question-001',
        v_content_id,
        'Apa yang dimaksud dengan pembelajaran berpusat pada peserta?',
        'multiple_choice',
        1,
        10,
        'Pembelajaran berpusat pada peserta adalah pendekatan pembelajaran yang menempatkan peserta sebagai subjek aktif dalam proses pembelajaran.',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        question_text = EXCLUDED.question_text,
        updated_at = NOW()
    RETURNING id INTO v_question_id1;

    -- Options for Question 1
    INSERT INTO public.quiz_options (id, question_id, option_text, is_correct, order_index, created_at) VALUES
    ('quiz-option-001', v_question_id1, 'Pendekatan dimana instruktur menjelaskan semua materi', false, 1, NOW()),
    ('quiz-option-002', v_question_id1, 'Pendekatan yang menempatkan peserta sebagai subjek aktif', true, 2, NOW()),
    ('quiz-option-003', v_question_id1, 'Pembelajaran dengan membaca buku saja', false, 3, NOW()),
    ('quiz-option-004', v_question_id1, 'Kelas tanpa instruktur', false, 4, NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Question 2: True/False
    INSERT INTO public.quiz_questions (
        id,
        content_id,
        question_text,
        question_type,
        order_index,
        points,
        explanation,
        correct_answer,
        created_at,
        updated_at
    ) VALUES (
        'quiz-question-002',
        v_content_id,
        'Setiap peserta memiliki gaya pembelajaran yang sama.',
        'true_false',
        2,
        5,
        'Benar! Setiap peserta memiliki gaya belajar yang berbeda, sehingga instruktur perlu menggunakan variasi metode pembelajaran.',
        'Salah',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        question_text = EXCLUDED.question_text,
        updated_at = NOW()
    RETURNING id INTO v_question_id2;

    -- Question 3: Multiple Choice
    INSERT INTO public.quiz_questions (
        id,
        content_id,
        question_text,
        question_type,
        order_index,
        points,
        explanation,
        created_at,
        updated_at
    ) VALUES (
        'quiz-question-003',
        v_content_id,
        'Manakah yang bukan merupakan ciri pembelajaran yang efektif?',
        'multiple_choice',
        3,
        10,
        'Pembelajaran yang efektif harus melibatkan peserta secara aktif, memberikan feedback, dan relevan dengan kebutuhan peserta.',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        question_text = EXCLUDED.question_text,
        updated_at = NOW()
    RETURNING id INTO v_question_id3;

    -- Options for Question 3
    INSERT INTO public.quiz_options (id, question_id, option_text, is_correct, order_index, created_at) VALUES
    ('quiz-option-005', v_question_id3, 'Melibatkan peserta secara aktif', false, 1, NOW()),
    ('quiz-option-006', v_question_id3, 'Memberikan feedback yang konstruktif', false, 2, NOW()),
    ('quiz-option-007', v_question_id3, 'Menggunakan materi yang tidak relevan', true, 3, NOW()),
    ('quiz-option-008', v_question_id3, 'Menggunakan metode yang variatif', false, 4, NOW())
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Sample quiz created successfully!';
    RAISE NOTICE 'Content ID: %', v_content_id;
    RAISE NOTICE 'Class ID: %', v_class_id;

END $$;

-- =====================================================
-- VERIFY THE CREATED DATA
-- =====================================================

-- Check learning contents
SELECT 
    lc.id,
    lc.title,
    lc.content_type,
    c.name as class_name,
    lc.status
FROM learning_contents lc
JOIN classes c ON c.id = lc.class_id
WHERE lc.content_type = 'quiz';

-- Check quiz questions
SELECT 
    qq.id,
    qq.question_text,
    qq.question_type,
    qq.points,
    lc.title as content_title
FROM quiz_questions qq
JOIN learning_contents lc ON lc.id = qq.content_id
ORDER BY qq.order_index;

-- Check quiz options
SELECT 
    qo.id,
    qo.option_text,
    qo.is_correct,
    qq.question_text
FROM quiz_options qo
JOIN quiz_questions qq ON qq.id = qo.question_id
ORDER BY qq.order_index, qo.order_index;

