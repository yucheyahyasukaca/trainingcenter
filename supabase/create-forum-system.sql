-- Create forum tables for program/class communication

-- Forum categories table
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum threads table
CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP WITH TIME ZONE,
  last_reply_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum replies table
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  is_solution BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum reactions table (likes, helpful, etc.)
CREATE TABLE IF NOT EXISTS forum_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  reaction_type VARCHAR(50) NOT NULL, -- 'like', 'helpful', 'solution'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, thread_id, reaction_type),
  UNIQUE(user_id, reply_id, reaction_type)
);

-- Add whatsapp_group_url to programs table
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_categories_program_id ON forum_categories(program_id);
CREATE INDEX IF NOT EXISTS idx_forum_categories_class_id ON forum_categories(class_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_category_id ON forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_author_id ON forum_threads(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_created_at ON forum_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_replies_thread_id ON forum_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author_id ON forum_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at ON forum_replies(created_at DESC);

-- Create RLS policies for forum_categories
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categories for enrolled programs" ON forum_categories
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments 
    WHERE enrollments.participant_id = auth.uid() 
    AND (
      (enrollments.program_id = forum_categories.program_id AND forum_categories.class_id IS NULL) OR
      (enrollments.class_id = forum_categories.class_id)
    )
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

-- Create RLS policies for forum_threads
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view threads for enrolled programs" ON forum_threads
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM forum_categories 
    JOIN enrollments ON (
      (enrollments.program_id = forum_categories.program_id AND forum_categories.class_id IS NULL) OR
      (enrollments.class_id = forum_categories.class_id)
    )
    WHERE forum_categories.id = forum_threads.category_id
    AND enrollments.participant_id = auth.uid()
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
    JOIN enrollments ON (
      (enrollments.program_id = forum_categories.program_id AND forum_categories.class_id IS NULL) OR
      (enrollments.class_id = forum_categories.class_id)
    )
    WHERE forum_categories.id = forum_threads.category_id
    AND enrollments.participant_id = auth.uid()
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

-- Create RLS policies for forum_replies
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view replies for enrolled programs" ON forum_replies
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM forum_threads
    JOIN forum_categories ON forum_categories.id = forum_threads.category_id
    JOIN enrollments ON (
      (enrollments.program_id = forum_categories.program_id AND forum_categories.class_id IS NULL) OR
      (enrollments.class_id = forum_categories.class_id)
    )
    WHERE forum_threads.id = forum_replies.thread_id
    AND enrollments.participant_id = auth.uid()
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
    JOIN enrollments ON (
      (enrollments.program_id = forum_categories.program_id AND forum_categories.class_id IS NULL) OR
      (enrollments.class_id = forum_categories.class_id)
    )
    WHERE forum_threads.id = forum_replies.thread_id
    AND enrollments.participant_id = auth.uid()
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

-- Create RLS policies for forum_reactions
ALTER TABLE forum_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reactions" ON forum_reactions
FOR ALL USING (user_id = auth.uid());

-- Create function to update thread reply count and last reply
CREATE OR REPLACE FUNCTION update_thread_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_threads 
    SET 
      reply_count = reply_count + 1,
      last_reply_at = NEW.created_at,
      last_reply_by = NEW.author_id
    WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_threads 
    SET 
      reply_count = reply_count - 1,
      last_reply_at = (
        SELECT MAX(created_at) 
        FROM forum_replies 
        WHERE thread_id = OLD.thread_id
      ),
      last_reply_by = (
        SELECT author_id 
        FROM forum_replies 
        WHERE thread_id = OLD.thread_id 
        ORDER BY created_at DESC 
        LIMIT 1
      )
    WHERE id = OLD.thread_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating thread stats
CREATE TRIGGER update_thread_stats_trigger
  AFTER INSERT OR DELETE ON forum_replies
  FOR EACH ROW EXECUTE FUNCTION update_thread_stats();

-- Create function to update thread view count
CREATE OR REPLACE FUNCTION increment_thread_view(thread_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE forum_threads 
  SET view_count = view_count + 1 
  WHERE id = thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default forum categories for existing programs
INSERT INTO forum_categories (program_id, name, description)
SELECT 
  id,
  'Diskusi Umum',
  'Forum diskusi umum untuk program ' || title
FROM programs 
WHERE status = 'published'
ON CONFLICT DO NOTHING;
