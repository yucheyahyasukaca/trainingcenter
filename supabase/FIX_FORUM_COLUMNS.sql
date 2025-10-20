-- Fix missing columns in forum_threads table
-- Run this after FORUM_NO_RLS.sql

-- Add missing columns to forum_threads table
ALTER TABLE forum_threads 
ADD COLUMN IF NOT EXISTS last_reply_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_reply_by UUID REFERENCES auth.users(id);

-- Add missing columns to forum_replies table
ALTER TABLE forum_replies 
ADD COLUMN IF NOT EXISTS is_solution BOOLEAN DEFAULT FALSE;

-- Create forum_reactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS forum_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  reaction_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, thread_id, reaction_type),
  UNIQUE(user_id, reply_id, reaction_type)
);

-- Disable RLS on forum_reactions
ALTER TABLE forum_reactions DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON forum_reactions TO authenticated;

-- Update the trigger function to handle the new columns
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_thread_stats_trigger ON forum_replies;
CREATE TRIGGER update_thread_stats_trigger
  AFTER INSERT OR DELETE ON forum_replies
  FOR EACH ROW EXECUTE FUNCTION update_thread_stats();
