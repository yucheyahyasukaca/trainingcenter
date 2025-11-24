-- Create storage bucket for email header images
-- This bucket stores header images for email templates

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'email-headers',
    'email-headers',
    true, -- Public bucket so images can be accessed via URL
    5242880, -- 5MB file size limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "email-headers Public Access" ON storage.objects;
DROP POLICY IF EXISTS "email-headers Service Upload" ON storage.objects;
DROP POLICY IF EXISTS "email-headers Service Update" ON storage.objects;
DROP POLICY IF EXISTS "email-headers Service Delete" ON storage.objects;

-- Set up RLS policies for the bucket
-- Allow public read access (since bucket is public)
CREATE POLICY "email-headers Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'email-headers');

-- Allow service role to upload (for API routes)
-- Service role bypasses RLS, but we add this for clarity
CREATE POLICY "email-headers Service Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'email-headers');

-- Allow service role to update
CREATE POLICY "email-headers Service Update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'email-headers');

-- Allow service role to delete
CREATE POLICY "email-headers Service Delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'email-headers');

