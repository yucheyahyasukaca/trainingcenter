-- Create and Verify Certificate System Storage Buckets
-- Jalankan script ini di Supabase SQL Editor untuk membuat dan memverifikasi buckets

-- ============================================================================
-- STEP 1: CREATE STORAGE BUCKETS
-- ============================================================================

-- Create bucket for certificate templates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'certificate-templates',
    'certificate-templates',
    false, -- Private bucket
    10485760, -- 10MB limit
    ARRAY['application/pdf']
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create bucket for generated certificates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'certificates',
    'certificates',
    true, -- Public bucket for easy access
    10485760, -- 10MB limit
    ARRAY['application/pdf']
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create bucket for QR codes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'certificate-qr-codes',
    'certificate-qr-codes',
    true, -- Public bucket for easy access
    1048576, -- 1MB limit
    ARRAY['image/png', 'image/jpeg']
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create bucket for signature images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'signatures',
    'signatures',
    false, -- Private bucket
    1048576, -- 1MB limit
    ARRAY['image/png', 'image/jpeg']
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- STEP 2: VERIFY BUCKETS CREATED
-- ============================================================================

SELECT 
    id as bucket_id,
    name as bucket_name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
WHERE id IN ('certificate-templates', 'certificates', 'certificate-qr-codes', 'signatures')
ORDER BY id;

-- ============================================================================
-- STEP 3: CHECK EXISTING POLICIES
-- ============================================================================

SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%certificate%'
ORDER BY policyname;
