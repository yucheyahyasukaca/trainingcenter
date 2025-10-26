-- Fix Storage RLS Policies for Certificate System
-- Jalankan script ini di Supabase SQL Editor untuk memperbaiki RLS

-- ============================================================================
-- STEP 1: DROP EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Certificate templates are viewable by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can upload certificate templates" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update certificate templates" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete certificate templates" ON storage.objects;

DROP POLICY IF EXISTS "Certificates are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Only system can upload certificates" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update certificates" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete certificates" ON storage.objects;

DROP POLICY IF EXISTS "QR codes are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Only system can upload QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete QR codes" ON storage.objects;

DROP POLICY IF EXISTS "Signatures are viewable by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can upload signatures" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update signatures" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete signatures" ON storage.objects;

-- ============================================================================
-- STEP 2: CREATE NEW POLICIES (ALLOW SERVICE ROLE)
-- ============================================================================

-- Policies for certificate-templates bucket
CREATE POLICY "Certificate templates are viewable by authenticated users" ON storage.objects
FOR SELECT USING (bucket_id = 'certificate-templates' AND auth.role() = 'authenticated');

-- Allow service role OR authenticated admin users to insert
CREATE POLICY "Service role and admins can upload certificate templates" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'certificate-templates' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
    )
);

CREATE POLICY "Service role and admins can update certificate templates" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'certificate-templates' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
    )
);

CREATE POLICY "Service role and admins can delete certificate templates" ON storage.objects
FOR DELETE USING (
    bucket_id = 'certificate-templates' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
    )
);

-- Policies for certificates bucket
CREATE POLICY "Certificates are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'certificates');

CREATE POLICY "Service role and admins can upload certificates" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'certificates' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')))
    )
);

CREATE POLICY "Service role and admins can update certificates" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'certificates' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
    )
);

CREATE POLICY "Service role and admins can delete certificates" ON storage.objects
FOR DELETE USING (
    bucket_id = 'certificates' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
    )
);

-- Policies for certificate-qr-codes bucket
CREATE POLICY "QR codes are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'certificate-qr-codes');

CREATE POLICY "Service role and admins can upload QR codes" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'certificate-qr-codes' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')))
    )
);

CREATE POLICY "Service role and admins can update QR codes" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'certificate-qr-codes' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
    )
);

CREATE POLICY "Service role and admins can delete QR codes" ON storage.objects
FOR DELETE USING (
    bucket_id = 'certificate-qr-codes' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
    )
);

-- Policies for signatures bucket
CREATE POLICY "Signatures are viewable by authenticated users" ON storage.objects
FOR SELECT USING (bucket_id = 'signatures' AND auth.role() = 'authenticated');

CREATE POLICY "Service role and admins can upload signatures" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'signatures' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
    )
);

CREATE POLICY "Service role and admins can update signatures" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'signatures' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
    )
);

CREATE POLICY "Service role and admins can delete signatures" ON storage.objects
FOR DELETE USING (
    bucket_id = 'signatures' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
    )
);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'Certificate system storage RLS policies updated successfully!' as message;
