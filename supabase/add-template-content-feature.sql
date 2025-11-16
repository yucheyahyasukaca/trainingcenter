-- =====================================================
-- ADD TEMPLATE CONTENT FEATURE
-- =====================================================
-- Menambahkan fitur template materi untuk bisa di-copy
-- oleh trainer lain di program yang sama
-- =====================================================

-- 1. Tambahkan kolom is_template ke learning_contents
ALTER TABLE public.learning_contents 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

-- 2. Tambahkan kolom template_source_id untuk tracking
-- (menyimpan ID materi asli yang di-copy)
ALTER TABLE public.learning_contents 
ADD COLUMN IF NOT EXISTS template_source_id UUID REFERENCES public.learning_contents(id) ON DELETE SET NULL;

-- 3. Tambahkan kolom program_id untuk memudahkan query template
-- (bisa diambil dari class->program, tapi lebih efisien jika langsung ada)
ALTER TABLE public.learning_contents 
ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE;

-- 4. Update program_id untuk data yang sudah ada
UPDATE public.learning_contents lc
SET program_id = (
    SELECT c.program_id 
    FROM public.classes c 
    WHERE c.id = lc.class_id
)
WHERE program_id IS NULL;

-- 5. Buat index untuk performa query template
CREATE INDEX IF NOT EXISTS idx_learning_contents_is_template ON public.learning_contents(is_template);
CREATE INDEX IF NOT EXISTS idx_learning_contents_program_id ON public.learning_contents(program_id);
CREATE INDEX IF NOT EXISTS idx_learning_contents_template_source ON public.learning_contents(template_source_id);

-- 6. Buat function untuk copy template content
CREATE OR REPLACE FUNCTION copy_template_content(
    p_template_id UUID,
    p_target_class_id UUID,
    p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_new_content_id UUID;
    v_template_content RECORD;
    v_sub_content RECORD;
    v_new_sub_content_id UUID;
BEGIN
    -- Get template content
    SELECT * INTO v_template_content
    FROM public.learning_contents
    WHERE id = p_template_id AND is_template = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template content not found';
    END IF;
    
    -- Get target class program_id
    DECLARE
        v_program_id UUID;
    BEGIN
        SELECT program_id INTO v_program_id
        FROM public.classes
        WHERE id = p_target_class_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Target class not found';
        END IF;
        
        -- Verify template is from same program
        IF v_template_content.program_id != v_program_id THEN
            RAISE EXCEPTION 'Template must be from the same program';
        END IF;
    END;
    
    -- Copy main content
    INSERT INTO public.learning_contents (
        class_id,
        program_id,
        created_by,
        title,
        description,
        content_type,
        content_data,
        order_index,
        is_free,
        status,
        is_required,
        estimated_duration,
        parent_id,
        material_type,
        is_template,
        template_source_id
    )
    VALUES (
        p_target_class_id,
        v_template_content.program_id,
        p_created_by,
        v_template_content.title,
        v_template_content.description,
        v_template_content.content_type,
        v_template_content.content_data,
        v_template_content.order_index,
        v_template_content.is_free,
        'draft', -- Set as draft when copied
        v_template_content.is_required,
        v_template_content.estimated_duration,
        NULL, -- Will be set for sub-materials
        v_template_content.material_type,
        false, -- Copied content is not a template by default
        p_template_id -- Track source template
    )
    RETURNING id INTO v_new_content_id;
    
    -- Copy sub-materials (if any)
    FOR v_sub_content IN 
        SELECT * FROM public.learning_contents
        WHERE parent_id = p_template_id
        ORDER BY order_index
    LOOP
        INSERT INTO public.learning_contents (
            class_id,
            program_id,
            created_by,
            title,
            description,
            content_type,
            content_data,
            order_index,
            is_free,
            status,
            is_required,
            estimated_duration,
            parent_id,
            material_type,
            is_template,
            template_source_id
        )
        VALUES (
            p_target_class_id,
            v_sub_content.program_id,
            p_created_by,
            v_sub_content.title,
            v_sub_content.description,
            v_sub_content.content_type,
            v_sub_content.content_data,
            v_sub_content.order_index,
            v_sub_content.is_free,
            'draft',
            v_sub_content.is_required,
            v_sub_content.estimated_duration,
            v_new_content_id, -- Link to new main content
            v_sub_content.material_type,
            false,
            v_sub_content.id
        )
        RETURNING id INTO v_new_sub_content_id;
        
        -- Copy quiz questions if content type is quiz
        IF v_sub_content.content_type = 'quiz' THEN
            INSERT INTO public.quiz_questions (
                content_id,
                question_text,
                question_type,
                order_index,
                points
            )
            SELECT 
                v_new_sub_content_id,
                qq.question_text,
                qq.question_type,
                qq.order_index,
                qq.points
            FROM public.quiz_questions qq
            WHERE qq.content_id = v_sub_content.id
            ORDER BY qq.order_index;
            
            -- Copy quiz options for each question
            INSERT INTO public.quiz_options (
                question_id,
                option_text,
                is_correct,
                order_index
            )
            SELECT 
                nqq.id,
                qo.option_text,
                qo.is_correct,
                qo.order_index
            FROM public.quiz_questions oqq
            JOIN public.quiz_questions nqq ON nqq.content_id = v_new_sub_content_id 
                AND nqq.order_index = oqq.order_index
            JOIN public.quiz_options qo ON qo.question_id = oqq.id
            WHERE oqq.content_id = v_sub_content.id
            ORDER BY qo.order_index;
        END IF;
    END LOOP;
    
    -- Copy quiz questions for main content if it's a quiz
    IF v_template_content.content_type = 'quiz' THEN
        INSERT INTO public.quiz_questions (
            content_id,
            question_text,
            question_type,
            order_index,
            points
        )
        SELECT 
            v_new_content_id,
            qq.question_text,
            qq.question_type,
            qq.order_index,
            qq.points
        FROM public.quiz_questions qq
        WHERE qq.content_id = p_template_id
        ORDER BY qq.order_index;
        
        -- Copy quiz options
        INSERT INTO public.quiz_options (
            question_id,
            option_text,
            is_correct,
            order_index
        )
        SELECT 
            nqq.id,
            qo.option_text,
            qo.is_correct,
            qo.order_index
        FROM public.quiz_questions oqq
        JOIN public.quiz_questions nqq ON nqq.content_id = v_new_content_id 
            AND nqq.order_index = oqq.order_index
        JOIN public.quiz_options qo ON qo.question_id = oqq.id
        WHERE oqq.content_id = p_template_id
        ORDER BY qo.order_index;
    END IF;
    
    RETURN v_new_content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant execute permission
GRANT EXECUTE ON FUNCTION copy_template_content(UUID, UUID, UUID) TO authenticated;

-- 8. Comment
COMMENT ON COLUMN public.learning_contents.is_template IS 'Marks content as template that can be copied by other trainers in the same program';
COMMENT ON COLUMN public.learning_contents.template_source_id IS 'Tracks the original template content ID when this content is copied from a template';
COMMENT ON COLUMN public.learning_contents.program_id IS 'Program ID for easier template querying';

