-- Create storage bucket for email signature logos
-- This bucket stores uploaded signature logo images

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'email-signatures',
    'email-signatures',
    true,
    2097152, -- 2MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access for signature logos
DROP POLICY IF EXISTS "email-signatures Public Access" ON storage.objects;
CREATE POLICY "email-signatures Public Access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'email-signatures');

-- Policy: Authenticated users can upload signature logos
DROP POLICY IF EXISTS "email-signatures Authenticated Upload" ON storage.objects;
CREATE POLICY "email-signatures Authenticated Upload"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'email-signatures' AND
    auth.role() = 'authenticated'
);

-- Policy: Authenticated users can update their signature logos
DROP POLICY IF EXISTS "email-signatures Authenticated Update" ON storage.objects;
CREATE POLICY "email-signatures Authenticated Update"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'email-signatures' AND
    auth.role() = 'authenticated'
);

-- Policy: Authenticated users can delete their signature logos
DROP POLICY IF EXISTS "email-signatures Authenticated Delete" ON storage.objects;
CREATE POLICY "email-signatures Authenticated Delete"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'email-signatures' AND
    auth.role() = 'authenticated'
);

