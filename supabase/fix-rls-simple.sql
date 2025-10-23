-- Fix RLS policies for classes and class_trainers
-- Drop existing policies
DROP POLICY IF EXISTS "classes_select_all" ON classes;
DROP POLICY IF EXISTS "classes_insert_all" ON classes;
DROP POLICY IF EXISTS "classes_update_all" ON classes;
DROP POLICY IF EXISTS "classes_delete_all" ON classes;

DROP POLICY IF EXISTS "Everyone can view classes of published programs" ON classes;
DROP POLICY IF EXISTS "Admins and managers can manage classes" ON classes;

-- Create simple policies that allow everyone to access classes
CREATE POLICY "classes_select_everyone" ON classes FOR SELECT USING (true);
CREATE POLICY "classes_insert_everyone" ON classes FOR INSERT WITH CHECK (true);
CREATE POLICY "classes_update_everyone" ON classes FOR UPDATE USING (true);
CREATE POLICY "classes_delete_everyone" ON classes FOR DELETE USING (true);

-- Fix class_trainers policies
DROP POLICY IF EXISTS "class_trainers_select_all" ON class_trainers;
DROP POLICY IF EXISTS "class_trainers_insert_all" ON class_trainers;
DROP POLICY IF EXISTS "class_trainers_update_all" ON class_trainers;
DROP POLICY IF EXISTS "class_trainers_delete_all" ON class_trainers;

DROP POLICY IF EXISTS "Everyone can view class trainers" ON class_trainers;
DROP POLICY IF EXISTS "Admins and managers can manage class trainers" ON class_trainers;

CREATE POLICY "class_trainers_select_everyone" ON class_trainers FOR SELECT USING (true);
CREATE POLICY "class_trainers_insert_everyone" ON class_trainers FOR INSERT WITH CHECK (true);
CREATE POLICY "class_trainers_update_everyone" ON class_trainers FOR UPDATE USING (true);
CREATE POLICY "class_trainers_delete_everyone" ON class_trainers FOR DELETE USING (true);

-- Test the fix
SELECT 'Testing classes access...' as test;
SELECT COUNT(*) as total_classes FROM classes;
SELECT COUNT(*) as total_class_trainers FROM class_trainers;
