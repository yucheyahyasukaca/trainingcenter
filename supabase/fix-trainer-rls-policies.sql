-- =====================================================
-- FIX TRAINER RLS POLICIES
-- =====================================================
-- Script untuk memperbaiki RLS policies agar trainer bisa mengakses semua fitur
-- =====================================================

-- 1. DROP EXISTING POLICIES
-- =====================================================

-- Drop classes policies
DROP POLICY IF EXISTS "Classes are viewable by authenticated users" ON classes;
DROP POLICY IF EXISTS "Classes are manageable by admins and managers" ON classes;

-- Drop class_trainers policies  
DROP POLICY IF EXISTS "Class trainers are viewable by authenticated users" ON class_trainers;
DROP POLICY IF EXISTS "Class trainers are manageable by admins and managers" ON class_trainers;

-- Drop learning_contents policies
DROP POLICY IF EXISTS "Learning contents are viewable by authenticated users" ON learning_contents;
DROP POLICY IF EXISTS "Learning contents are manageable by admins and managers" ON learning_contents;

-- Drop quiz_questions policies
DROP POLICY IF EXISTS "Quiz questions are viewable by authenticated users" ON quiz_questions;
DROP POLICY IF EXISTS "Quiz questions are manageable by admins and managers" ON quiz_questions;

-- Drop quiz_options policies
DROP POLICY IF EXISTS "Quiz options are viewable by authenticated users" ON quiz_options;
DROP POLICY IF EXISTS "Quiz options are manageable by admins and managers" ON quiz_options;

-- 2. CREATE NEW POLICIES FOR CLASSES
-- =====================================================

-- Classes: Viewable by everyone
CREATE POLICY "Classes are viewable by everyone" ON classes
  FOR SELECT USING (true);

-- Classes: Manageable by admins, managers, and assigned trainers
CREATE POLICY "Classes are manageable by admins, managers, and assigned trainers" ON classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'manager')
    )
    OR EXISTS (
      SELECT 1 FROM class_trainers ct
      WHERE ct.class_id = classes.id
      AND ct.trainer_id = auth.uid()
    )
  );

-- 3. CREATE NEW POLICIES FOR CLASS_TRAINERS
-- =====================================================

-- Class trainers: Viewable by everyone
CREATE POLICY "Class trainers are viewable by everyone" ON class_trainers
  FOR SELECT USING (true);

-- Class trainers: Manageable by admins, managers, and assigned trainers
CREATE POLICY "Class trainers are manageable by admins, managers, and assigned trainers" ON class_trainers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'manager')
    )
    OR trainer_id = auth.uid()
  );

-- 4. CREATE NEW POLICIES FOR LEARNING_CONTENTS
-- =====================================================

-- Learning contents: Viewable by everyone (published content)
CREATE POLICY "Learning contents are viewable by everyone" ON learning_contents
  FOR SELECT USING (status = 'published');

-- Learning contents: Manageable by admins, managers, and assigned trainers
CREATE POLICY "Learning contents are manageable by admins, managers, and assigned trainers" ON learning_contents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'manager')
    )
    OR EXISTS (
      SELECT 1 FROM class_trainers ct
      WHERE ct.class_id = learning_contents.class_id
      AND ct.trainer_id = auth.uid()
    )
  );

-- 5. CREATE NEW POLICIES FOR QUIZ_QUESTIONS
-- =====================================================

-- Quiz questions: Viewable by everyone (published content)
CREATE POLICY "Quiz questions are viewable by everyone" ON quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM learning_contents lc
      WHERE lc.id = quiz_questions.content_id
      AND lc.status = 'published'
    )
  );

-- Quiz questions: Manageable by admins, managers, and assigned trainers
CREATE POLICY "Quiz questions are manageable by admins, managers, and assigned trainers" ON quiz_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'manager')
    )
    OR EXISTS (
      SELECT 1 FROM learning_contents lc
      JOIN class_trainers ct ON lc.class_id = ct.class_id
      WHERE lc.id = quiz_questions.content_id
      AND ct.trainer_id = auth.uid()
    )
  );

-- 6. CREATE NEW POLICIES FOR QUIZ_OPTIONS
-- =====================================================

-- Quiz options: Viewable by everyone (published content)
CREATE POLICY "Quiz options are viewable by everyone" ON quiz_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_questions qq
      JOIN learning_contents lc ON qq.content_id = lc.id
      WHERE qq.id = quiz_options.question_id
      AND lc.status = 'published'
    )
  );

-- Quiz options: Manageable by admins, managers, and assigned trainers
CREATE POLICY "Quiz options are manageable by admins, managers, and assigned trainers" ON quiz_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'manager')
    )
    OR EXISTS (
      SELECT 1 FROM quiz_questions qq
      JOIN learning_contents lc ON qq.content_id = lc.id
      JOIN class_trainers ct ON lc.class_id = ct.class_id
      WHERE qq.id = quiz_options.question_id
      AND ct.trainer_id = auth.uid()
    )
  );

-- 7. VERIFY POLICIES
-- =====================================================

-- Check if all policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('classes', 'class_trainers', 'learning_contents', 'quiz_questions', 'quiz_options')
ORDER BY tablename, policyname;
