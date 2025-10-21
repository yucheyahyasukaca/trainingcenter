-- ============================================================================
-- CREATE FORUM STORAGE BUCKET
-- Membuat bucket untuk menyimpan file forum (gambar, dokumen, dll)
-- ============================================================================

-- Create storage bucket for forum attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'forum-attachments',
  'forum-attachments', 
  true,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for forum attachments bucket
CREATE POLICY "Anyone can view forum attachments" ON storage.objects
FOR SELECT USING (bucket_id = 'forum-attachments');

CREATE POLICY "Authenticated users can upload forum attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'forum-attachments' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own forum attachments" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'forum-attachments'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete their own forum attachments" ON storage.objects
FOR DELETE USING (
  bucket_id = 'forum-attachments'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✓ Forum storage bucket created successfully!';
    RAISE NOTICE '✓ Bucket: forum-attachments';
    RAISE NOTICE '✓ Public access enabled';
    RAISE NOTICE '✓ File size limit: 10MB';
    RAISE NOTICE '✓ Allowed types: Images, PDFs, Word docs, Text files';
    RAISE NOTICE '✓ RLS policies configured';
END $$;
