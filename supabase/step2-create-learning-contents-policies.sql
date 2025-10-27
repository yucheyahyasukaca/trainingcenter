-- =====================================================
-- STEP 2: CREATE LEARNING CONTENTS POLICIES
-- =====================================================
-- Jalankan script ini setelah Step 1 berhasil
-- =====================================================

-- Policy 1: Admin full access on learning_contents
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

-- Policy 2: Assigned trainers can manage their class contents
CREATE POLICY "Assigned trainers can manage their class contents"
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
    OR EXISTS (
        SELECT 1 FROM public.classes c
        JOIN public.class_trainers ct ON c.id = ct.class_id
        JOIN public.trainers t ON ct.trainer_id = t.id
        WHERE c.id = learning_contents.class_id
        AND t.user_id = auth.uid()
    )
);

-- Policy 3: Users can view published content (existing policy, keep as is)
CREATE POLICY "Users can view published content"
ON public.learning_contents
FOR SELECT
TO authenticated
USING (
    status = 'published' AND (
        is_free = true
        OR EXISTS (
            SELECT 1 FROM public.enrollments e
            JOIN public.participants p ON e.participant_id = p.id
            JOIN public.classes c ON e.class_id = c.id
            WHERE c.id = learning_contents.class_id
            AND p.user_id = auth.uid()
            AND e.status = 'approved'
        )
    )
);

-- Verifikasi policies berhasil dibuat
SELECT 'Learning contents policies created successfully' as status;
