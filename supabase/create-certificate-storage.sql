-- Create Storage Buckets for Certificate System
-- Jalankan SQL ini di Supabase SQL Editor untuk membuat storage buckets

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
-- STEP 2: CREATE STORAGE POLICIES
-- ============================================================================

-- Policies for certificate-templates bucket
CREATE POLICY "Certificate templates are viewable by authenticated users" ON storage.objects
FOR SELECT USING (bucket_id = 'certificate-templates' AND auth.role() = 'authenticated');

CREATE POLICY "Only admins can upload certificate templates" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'certificate-templates' 
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Only admins can update certificate templates" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'certificate-templates' 
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Only admins can delete certificate templates" ON storage.objects
FOR DELETE USING (
    bucket_id = 'certificate-templates' 
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for certificates bucket
CREATE POLICY "Certificates are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'certificates');

CREATE POLICY "Only system can upload certificates" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'certificates' 
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Only admins can update certificates" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'certificates' 
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Only admins can delete certificates" ON storage.objects
FOR DELETE USING (
    bucket_id = 'certificates' 
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for certificate-qr-codes bucket
CREATE POLICY "QR codes are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'certificate-qr-codes');

CREATE POLICY "Only system can upload QR codes" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'certificate-qr-codes' 
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Only admins can update QR codes" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'certificate-qr-codes' 
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Only admins can delete QR codes" ON storage.objects
FOR DELETE USING (
    bucket_id = 'certificate-qr-codes' 
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for signatures bucket
CREATE POLICY "Signatures are viewable by authenticated users" ON storage.objects
FOR SELECT USING (bucket_id = 'signatures' AND auth.role() = 'authenticated');

CREATE POLICY "Only admins can upload signatures" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'signatures' 
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Only admins can update signatures" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'signatures' 
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Only admins can delete signatures" ON storage.objects
FOR DELETE USING (
    bucket_id = 'signatures' 
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'Certificate system storage buckets created successfully!' as message;
