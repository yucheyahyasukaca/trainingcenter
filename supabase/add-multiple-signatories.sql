-- Add Multiple Signatories Support to Certificate System
-- Jalankan script ini di Supabase SQL Editor

-- ============================================================================
-- STEP 1: CREATE SIGNATORIES TABLE
-- ============================================================================

-- Tabel untuk menyimpan data penandatangan
CREATE TABLE IF NOT EXISTS certificate_signatories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID REFERENCES certificate_templates(id) ON DELETE CASCADE NOT NULL,
    signatory_name VARCHAR(255) NOT NULL,
    signatory_position VARCHAR(255) NOT NULL,
    signatory_signature_url TEXT, -- URL ke file signature image
    sign_order INTEGER NOT NULL DEFAULT 1, -- Urutan penandatangan
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: MIGRATE EXISTING SIGNATORY DATA
-- ============================================================================

-- Migrate existing signatory data from certificate_templates to certificate_signatories
INSERT INTO certificate_signatories (template_id, signatory_name, signatory_position, signatory_signature_url, sign_order, is_active, created_at, updated_at)
SELECT 
    id as template_id,
    signatory_name,
    signatory_position,
    signatory_signature_url,
    1 as sign_order,
    true as is_active,
    created_at,
    updated_at
FROM certificate_templates
WHERE NOT EXISTS (
    SELECT 1 FROM certificate_signatories cs 
    WHERE cs.template_id = certificate_templates.id
);

-- ============================================================================
-- STEP 3: ADD INDEX FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_certificate_signatories_template_id 
ON certificate_signatories(template_id);

CREATE INDEX IF NOT EXISTS idx_certificate_signatories_template_order 
ON certificate_signatories(template_id, sign_order);

-- ============================================================================
-- STEP 4: CREATE RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE certificate_signatories ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active signatories
CREATE POLICY "Anyone can read active signatories"
ON certificate_signatories
FOR SELECT
USING (is_active = true);

-- Policy: Only admins can manage signatories
CREATE POLICY "Only admins can insert signatories"
ON certificate_signatories
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Only admins can update signatories"
ON certificate_signatories
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Only admins can delete signatories"
ON certificate_signatories
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get all signatories for a template
CREATE OR REPLACE FUNCTION get_template_signatories(template_id UUID)
RETURNS TABLE (
    id UUID,
    signatory_name VARCHAR(255),
    signatory_position VARCHAR(255),
    signatory_signature_url TEXT,
    sign_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id,
        cs.signatory_name,
        cs.signatory_position,
        cs.signatory_signature_url,
        cs.sign_order
    FROM certificate_signatories cs
    WHERE cs.template_id = get_template_signatories.template_id
    AND cs.is_active = true
    ORDER BY cs.sign_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'Multiple signatories support added successfully!' as message,
       (SELECT COUNT(*) FROM certificate_signatories) as total_signatories;
