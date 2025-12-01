-- Fix RLS policies for HEBAT tables
-- The previous policies assumed trainer_id = auth.uid(), but trainer_id is a separate UUID in the trainers table.

-- 1. Fix trainer_module_progress policies
DROP POLICY IF EXISTS "Trainers can view own progress" ON trainer_module_progress;
DROP POLICY IF EXISTS "Trainers can update own progress" ON trainer_module_progress;
DROP POLICY IF EXISTS "Trainers can update own progress update" ON trainer_module_progress;

CREATE POLICY "Trainers can view own progress" ON trainer_module_progress
    FOR SELECT
    USING (
        trainer_id IN (
            SELECT id FROM trainers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Trainers can insert own progress" ON trainer_module_progress
    FOR INSERT
    WITH CHECK (
        trainer_id IN (
            SELECT id FROM trainers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Trainers can update own progress" ON trainer_module_progress
    FOR UPDATE
    USING (
        trainer_id IN (
            SELECT id FROM trainers WHERE user_id = auth.uid()
        )
    );

-- 2. Fix trainer_hebat_activities policies
DROP POLICY IF EXISTS "Trainers can read own activities" ON trainer_hebat_activities;

CREATE POLICY "Trainers can read own activities" ON trainer_hebat_activities
    FOR SELECT
    USING (
        trainer_id IN (
            SELECT id FROM trainers WHERE user_id = auth.uid()
        )
    );

-- Note: "System can insert activities" was WITH CHECK (true), which is fine for now as it allows the trigger to work,
-- but ideally we should restrict it too. For now, we leave it to avoid breaking other things.
