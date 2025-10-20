-- Forum RLS Policies - Run this after SIMPLE_FORUM_SETUP.sql
-- Step 2: Add security policies

-- Enable RLS on all forum tables
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view categories for enrolled programs" ON forum_categories;
DROP POLICY IF EXISTS "Admins and managers can manage categories" ON forum_categories;
DROP POLICY IF EXISTS "Users can view threads for enrolled programs" ON forum_threads;
DROP POLICY IF EXISTS "Users can create threads for enrolled programs" ON forum_threads;
DROP POLICY IF EXISTS "Users can update their own threads" ON forum_threads;
DROP POLICY IF EXISTS "Admins and managers can manage all threads" ON forum_threads;
DROP POLICY IF EXISTS "Users can view replies for enrolled programs" ON forum_replies;
DROP POLICY IF EXISTS "Users can create replies for enrolled programs" ON forum_replies;
DROP POLICY IF EXISTS "Users can update their own replies" ON forum_replies;
DROP POLICY IF EXISTS "Admins and managers can manage all replies" ON forum_replies;

-- Forum Categories Policies
CREATE POLICY "Users can view categories for enrolled programs" ON forum_categories
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments 
    WHERE enrollments.participant_id = (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
    AND enrollments.program_id = forum_categories.program_id
    AND enrollments.status = 'approved'
  ) OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins and managers can manage categories" ON forum_categories
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Forum Threads Policies
CREATE POLICY "Users can view threads for enrolled programs" ON forum_threads
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM forum_categories 
    JOIN enrollments ON enrollments.program_id = forum_categories.program_id
    WHERE forum_categories.id = forum_threads.category_id
    AND enrollments.participant_id = (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
    AND enrollments.status = 'approved'
  ) OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Users can create threads for enrolled programs" ON forum_threads
FOR INSERT WITH CHECK (
  author_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM forum_categories 
    JOIN enrollments ON enrollments.program_id = forum_categories.program_id
    WHERE forum_categories.id = forum_threads.category_id
    AND enrollments.participant_id = (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
    AND enrollments.status = 'approved'
  )
);

CREATE POLICY "Users can update their own threads" ON forum_threads
FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Admins and managers can manage all threads" ON forum_threads
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Forum Replies Policies
CREATE POLICY "Users can view replies for enrolled programs" ON forum_replies
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM forum_threads
    JOIN forum_categories ON forum_categories.id = forum_threads.category_id
    JOIN enrollments ON enrollments.program_id = forum_categories.program_id
    WHERE forum_threads.id = forum_replies.thread_id
    AND enrollments.participant_id = (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
    AND enrollments.status = 'approved'
  ) OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Users can create replies for enrolled programs" ON forum_replies
FOR INSERT WITH CHECK (
  author_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM forum_threads
    JOIN forum_categories ON forum_categories.id = forum_threads.category_id
    JOIN enrollments ON enrollments.program_id = forum_categories.program_id
    WHERE forum_threads.id = forum_replies.thread_id
    AND enrollments.participant_id = (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
    AND enrollments.status = 'approved'
  )
);

CREATE POLICY "Users can update their own replies" ON forum_replies
FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Admins and managers can manage all replies" ON forum_replies
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);
