-- Fix Certificate Storage Admin Access
-- Jalankan script ini di Supabase SQL Editor untuk memperbaiki RLS
-- Script ini akan memperbaiki RLS agar admin bisa create, edit, view semua certificate

-- ============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================================================

DO $$
DECLARE
    policy_name TEXT;
BEGIN
    -- Drop all policies related to certificate buckets
    FOR policy_name IN
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname LIKE '%certificate%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: CREATE ADMIN-FRIENDLY POLICIES
-- ============================================================================

-- Policies for certificate-templates bucket
-- Anyone authenticated can view
CREATE POLICY "Anyone authenticated can view certificate templates" ON storage.objects
FOR SELECT 
USING (
    bucket_id = 'certificate-templates' 
    AND auth.role() = 'authenticated'
);

-- Service role and admins can insert
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

-- Service role and admins can update
CREATE POLICY "Service and admin can update certificate templates" ON storage.objects
FOR UPDATE 
USING (
    bucket_id = 'certificate-templates' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    )
)
WITH CHECK (
    bucket_id = 'certificate-templates' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    )
);

-- Service role and admins can delete
CREATE POLICY "Service and admin can delete certificate templates" ON storage.objects
FOR DELETE 
USING (
    bucket_id = 'certificate-templates' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    )
);

-- Policies for certificates bucket
-- Public read access
CREATE POLICY "Certificates are publicly readable" ON storage.objects
FOR SELECT 
USING (bucket_id = 'certificates');

-- Service role, admin, and manager can insert
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

-- Service role and admin can update
CREATE POLICY "Service and admin can update certificates" ON storage.objects
FOR UPDATE 
USING (
    bucket_id = 'certificates' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    )
)
WITH CHECK (
    bucket_id = 'certificates' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    )
);

-- Service role and admin can delete
CREATE POLICY "Service and admin can delete certificates" ON storage.objects
FOR DELETE 
USING (
    bucket_id = 'certificates' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    )
);

-- Policies for certificate-qr-codes bucket
-- Public read access
CREATE POLICY "QR codes are publicly readable" ON storage.objects
FOR SELECT 
USING (bucket_id = 'certificate-qr-codes');

-- Service role, admin, and manager can insert
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

-- Service role and admin can update
CREATE POLICY "Service and admin can update QR codes" ON storage.objects
FOR UPDATE 
USING (
    bucket_id = 'certificate-qr-codes' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    )
)
WITH CHECK (
    bucket_id = 'certificate-qr-codes' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    )
);

-- Service role and admin can delete
CREATE POLICY "Service and admin can delete QR codes" ON storage.objects
FOR DELETE 
USING (
    bucket_id = 'certificate-qr-codes' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    )
);

-- Policies for signatures bucket
-- Authenticated users can view
CREATE POLICY "Authenticated users can view signatures" ON storage.objects
FOR SELECT 
USING (
    bucket_id = 'signatures' 
    AND auth.role() = 'authenticated'
);

-- Service role and admin can insert
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

-- Service role and admin can update
CREATE POLICY "Service and admin can update signatures" ON storage.objects
FOR UPDATE 
USING (
    bucket_id = 'signatures' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    )
)
WITH CHECK (
    bucket_id = 'signatures' AND (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    )
);

-- Service role and admin can delete
CREATE POLICY "Service and admin can delete signatures" ON storage.objects
FOR DELETE 
USING (
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
    'Certificate storage admin access fixed successfully!' as message,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%certificate%') as policies_created;
