-- URL Shortener System
-- Create table for short URL management
-- Run this in Supabase SQL Editor

-- Create short_links table
CREATE TABLE IF NOT EXISTS short_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  short_code VARCHAR(50) UNIQUE NOT NULL,
  destination_url TEXT NOT NULL,
  description TEXT,
  click_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on short_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_short_links_code ON short_links(short_code);
CREATE INDEX IF NOT EXISTS idx_short_links_active ON short_links(is_active, expires_at);

-- Create function to update updated_at automatically
CREATE OR REPLACE FUNCTION update_short_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_short_links_updated_at ON short_links;
CREATE TRIGGER trigger_update_short_links_updated_at
  BEFORE UPDATE ON short_links
  FOR EACH ROW
  EXECUTE FUNCTION update_short_links_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE short_links ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to read active short links (for redirection)
CREATE POLICY "Anyone can read active short links"
  ON short_links
  FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Allow authenticated users with admin role to manage short links
CREATE POLICY "Admin can manage short links"
  ON short_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT SELECT ON short_links TO authenticated;
GRANT ALL ON short_links TO authenticated;

-- Insert a sample short link (optional)
-- INSERT INTO short_links (short_code, destination_url, description, created_by)
-- VALUES ('gemini2025', 'https://your-domain.com/programs/9712d177-5cf4-4ed2-8e66-f871affb0549', 'Gemini 2025 Program', NULL);

