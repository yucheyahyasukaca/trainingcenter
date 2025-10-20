-- Complete Forum Setup - All columns included
-- This creates forum tables with all necessary columns

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS forum_reactions CASCADE;
DROP TABLE IF EXISTS forum_replies CASCADE;
DROP TABLE IF EXISTS forum_threads CASCADE;
DROP TABLE IF EXISTS forum_categories CASCADE;

-- 1. Create forum_categories table
CREATE TABLE forum_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create forum_threads table with all columns
CREATE TABLE forum_threads (
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

-- 3. Create forum_replies table with all columns
CREATE TABLE forum_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  is_solution BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create forum_reactions table
CREATE TABLE forum_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  reaction_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, thread_id, reaction_type),
  UNIQUE(user_id, reply_id, reaction_type)
);

-- 5. Add whatsapp_group_url to programs table if it doesn't exist
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT;

-- 6. Create indexes
CREATE INDEX idx_forum_categories_program_id ON forum_categories(program_id);
CREATE INDEX idx_forum_threads_category_id ON forum_threads(category_id);
CREATE INDEX idx_forum_threads_author_id ON forum_threads(author_id);
CREATE INDEX idx_forum_threads_created_at ON forum_threads(created_at DESC);
CREATE INDEX idx_forum_replies_thread_id ON forum_replies(thread_id);
CREATE INDEX idx_forum_replies_author_id ON forum_replies(author_id);
CREATE INDEX idx_forum_replies_created_at ON forum_replies(created_at DESC);

-- 7. Disable RLS on all forum tables (for testing)
ALTER TABLE forum_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies DISABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reactions DISABLE ROW LEVEL SECURITY;

-- 8. Grant permissions to authenticated users
GRANT ALL ON forum_categories TO authenticated;
GRANT ALL ON forum_threads TO authenticated;
GRANT ALL ON forum_replies TO authenticated;
GRANT ALL ON forum_reactions TO authenticated;

-- 9. Create function to update thread stats
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

-- 10. Create trigger for updating thread stats
CREATE TRIGGER update_thread_stats_trigger
  AFTER INSERT OR DELETE ON forum_replies
  FOR EACH ROW EXECUTE FUNCTION update_thread_stats();

-- 11. Create function to increment view count
CREATE OR REPLACE FUNCTION increment_thread_view(thread_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE forum_threads 
  SET view_count = view_count + 1 
  WHERE id = thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Insert default forum categories for existing programs
INSERT INTO forum_categories (program_id, name, description)
SELECT 
  id,
  'Diskusi Umum',
  'Forum diskusi umum untuk program ' || title
FROM programs 
WHERE status = 'published'
ON CONFLICT DO NOTHING;
