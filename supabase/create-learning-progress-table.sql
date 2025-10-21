-- Create learning_progress table
CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  enrollment_id UUID,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  time_spent INTEGER DEFAULT 0, -- in seconds
  last_position INTEGER DEFAULT 0, -- for video/audio content
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_content_id ON learning_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_enrollment_id ON learning_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_status ON learning_progress(status);

-- Create unique constraint to prevent duplicate progress records
CREATE UNIQUE INDEX IF NOT EXISTS idx_learning_progress_unique_user_content 
ON learning_progress(user_id, content_id);

-- Enable RLS
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own progress" ON learning_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON learning_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON learning_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress" ON learning_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_learning_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_learning_progress_updated_at
  BEFORE UPDATE ON learning_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_progress_updated_at();

-- Insert sample data for testing (optional)
INSERT INTO learning_progress (user_id, content_id, enrollment_id, status, progress_percentage, completed_at)
SELECT 
  auth.uid(),
  lc.id,
  e.id,
  'not_started',
  0,
  NULL
FROM learning_contents lc
CROSS JOIN enrollments e
WHERE e.user_id = auth.uid()
ON CONFLICT (user_id, content_id) DO NOTHING;
