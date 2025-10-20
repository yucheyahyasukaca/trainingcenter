-- Forum Helper Functions - Run this after FORUM_RLS_POLICIES.sql
-- Step 3: Add helper functions

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
DROP TRIGGER IF EXISTS update_thread_stats_trigger ON forum_replies;
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
