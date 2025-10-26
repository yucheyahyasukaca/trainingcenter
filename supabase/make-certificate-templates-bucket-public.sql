-- Make certificate-templates bucket public
-- Jalankan script ini di Supabase SQL Editor

UPDATE storage.buckets
SET public = true
WHERE id = 'certificate-templates';

SELECT 
    id as bucket_id,
    name as bucket_name,
    public,
    created_at
FROM storage.buckets
WHERE id = 'certificate-templates';
