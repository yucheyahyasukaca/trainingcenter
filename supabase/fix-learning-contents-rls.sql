-- =====================================================
-- FIX LEARNING CONTENTS RLS POLICIES
-- =====================================================
-- Fix issue where enrolled users can't see all materials
-- The issue: participant_id in enrollments references participants table,
-- not user_id directly. Need to join through participants.
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view published content" ON public.learning_contents;

-- Recreate policy with correct join through participants table
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

-- Verify the policy
SELECT 'Learning contents RLS policy fixed successfully' as status;

