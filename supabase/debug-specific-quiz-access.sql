-- =====================================================
-- DEBUG: CHECK SPECIFIC QUIZ ACCESS
-- =====================================================
-- Jalankan script ini untuk debug akses quiz spesifik
-- =====================================================

-- Cek content "Pretest - Program"
SELECT 
    'Quiz Content' as info,
    lc.id as content_id,
    lc.title,
    lc.content_type,
    lc.class_id,
    c.name as class_name,
    p.title as program_title,
    p.id as program_id,
    p.trainer_id as program_trainer_id
FROM public.learning_contents lc
JOIN public.classes c ON lc.class_id = c.id
JOIN public.programs p ON c.program_id = p.id
WHERE lc.title LIKE '%Pretest%' OR lc.title LIKE '%Program%'
ORDER BY lc.created_at;

-- Cek trainer yang ditugaskan ke kelas tersebut
SELECT 
    'Class Trainers for Quiz Class' as info,
    ct.id,
    ct.class_id,
    ct.trainer_id,
    ct.role,
    c.name as class_name,
    p.title as program_title,
    t.user_id as trainer_user_id,
    up.full_name as trainer_name,
    up.email as trainer_email
FROM public.class_trainers ct
JOIN public.classes c ON ct.class_id = c.id
JOIN public.programs p ON c.program_id = p.id
JOIN public.trainers t ON ct.trainer_id = t.id
JOIN public.user_profiles up ON t.user_id = up.id
WHERE c.id IN (
    SELECT lc.class_id 
    FROM public.learning_contents lc 
    WHERE lc.title LIKE '%Pretest%' OR lc.title LIKE '%Program%'
);

-- Cek apakah ada quiz_questions untuk content tersebut
SELECT 
    'Quiz Questions' as info,
    qq.id as question_id,
    qq.content_id,
    qq.question_text,
    qq.question_type,
    lc.title as content_title
FROM public.quiz_questions qq
JOIN public.learning_contents lc ON qq.content_id = lc.id
WHERE lc.title LIKE '%Pretest%' OR lc.title LIKE '%Program%';
