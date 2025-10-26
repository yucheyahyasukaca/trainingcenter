-- Fix INSERT Policies with NULL qual
-- Jalankan script ini untuk memperbaiki INSERT policies yang menyebabkan "Bucket not found"

-- ============================================================================
-- STEP 1: DROP ALL INSERT POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Service admin manager can insert certificates" ON storage.objects;
DROP POLICY IF EXISTS "Service and admin can insert certificate templates" ON storage.objects;
DROP POLICY IF EXISTS "Service admin manager can insert QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Service and admin can insert signatures" ON storage.objects;

-- ============================================================================
-- STEP 2: RECREATE INSERT POLICIES WITH PROPER CHECK
-- ============================================================================

-- Policy for inserting certificate templates
CREATE POLICY "Service and admin can insert certificate templates" ON storage.objects
FOR INSERT 
WITH CHECK (
    bucket_id = 'certificate-templates' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    )
);

-- Policy for inserting certificates
CREATE POLICY "Service admin manager can insert certificates" ON storage.objects
FOR INSERT 
WITH CHECK (
    bucket_id = 'certificates' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        ))
    )
);

-- Policy for inserting QR codes
CREATE POLICY "Service admin manager can insert QR codes" ON storage.objects
FOR INSERT 
WITH CHECK (
    bucket_id = 'certificate-qr-codes' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        ))
    )
);

-- Policy for inserting signatures
CREATE POLICY "Service and admin can insert signatures" ON storage.objects
FOR INSERT 
WITH CHECK (
    bucket_id = 'signatures' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    )
);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 
    'INSERT policies fixed successfully!' as message,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE tablename = 'objects' 
     AND cmd = 'INSERT' 
     AND policyname LIKE '%certificate%') as insert_policies_created;
