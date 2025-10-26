-- Certificate System Database Schema (FIXED)
-- Jalankan SQL ini di Supabase SQL Editor untuk membuat sistem sertifikat

-- ============================================================================
-- STEP 1: CREATE CERTIFICATE TEMPLATES TABLE
-- ============================================================================

-- Certificate templates table untuk menyimpan template PDF yang diupload admin
CREATE TABLE IF NOT EXISTS certificate_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    template_description TEXT,
    template_pdf_url TEXT NOT NULL, -- URL ke file PDF template di storage
    template_fields JSONB NOT NULL DEFAULT '{}', -- Field yang bisa diisi di template
    -- Field untuk penandatangan
    signatory_name VARCHAR(255) NOT NULL,
    signatory_position VARCHAR(255) NOT NULL,
    signatory_signature_url TEXT, -- URL ke file signature image
    -- Field untuk peserta
    participant_name_field VARCHAR(100) DEFAULT 'participant_name',
    participant_company_field VARCHAR(100) DEFAULT 'participant_company',
    participant_position_field VARCHAR(100) DEFAULT 'participant_position',
    -- Field untuk program
    program_title_field VARCHAR(100) DEFAULT 'program_title',
    program_date_field VARCHAR(100) DEFAULT 'program_date',
    completion_date_field VARCHAR(100) DEFAULT 'completion_date',
    -- Field untuk trainer (jika sertifikat trainer)
    trainer_name_field VARCHAR(100) DEFAULT 'trainer_name',
    trainer_level_field VARCHAR(100) DEFAULT 'trainer_level',
    -- Status dan metadata
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: CREATE CERTIFICATES TABLE
-- ============================================================================

-- Certificates table untuk menyimpan sertifikat yang sudah digenerate
CREATE TABLE IF NOT EXISTS certificates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    certificate_number VARCHAR(50) UNIQUE NOT NULL, -- Nomor sertifikat unik
    template_id UUID REFERENCES certificate_templates(id) ON DELETE CASCADE NOT NULL,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    -- Penerima sertifikat
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('participant', 'trainer')),
    recipient_id UUID NOT NULL, -- ID dari participants atau user_profiles
    recipient_name VARCHAR(255) NOT NULL,
    recipient_company VARCHAR(255),
    recipient_position VARCHAR(255),
    -- Data program
    program_title VARCHAR(255) NOT NULL,
    program_start_date DATE,
    program_end_date DATE,
    completion_date DATE NOT NULL,
    -- Data trainer (jika sertifikat untuk trainer)
    trainer_name VARCHAR(255),
    trainer_level VARCHAR(50),
    -- File sertifikat
    certificate_pdf_url TEXT NOT NULL, -- URL ke file PDF sertifikat yang sudah digenerate
    certificate_qr_code_url TEXT NOT NULL, -- URL ke QR code image
    qr_code_data TEXT NOT NULL, -- Data yang di-encode dalam QR code
    -- Status dan metadata
    status VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('issued', 'revoked', 'expired')),
    issued_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiry date
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: CREATE CERTIFICATE REQUIREMENTS TABLE
-- ============================================================================

-- Certificate requirements table untuk menentukan syarat kelulusan
CREATE TABLE IF NOT EXISTS certificate_requirements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
    requirement_type VARCHAR(50) NOT NULL CHECK (requirement_type IN ('completion_percentage', 'min_participants', 'min_pass_rate', 'all_activities')),
    requirement_value DECIMAL(5,2) NOT NULL, -- Nilai requirement (persentase, jumlah peserta, dll)
    requirement_description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: CREATE CERTIFICATE VERIFICATION TABLE
-- ============================================================================

-- Certificate verification table untuk tracking verifikasi QR code
CREATE TABLE IF NOT EXISTS certificate_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    certificate_id UUID REFERENCES certificates(id) ON DELETE CASCADE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_by_ip INET,
    verified_by_user_agent TEXT,
    verification_result VARCHAR(20) DEFAULT 'valid' CHECK (verification_result IN ('valid', 'invalid', 'expired', 'revoked')),
    notes TEXT
);

-- ============================================================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for certificate_templates
CREATE INDEX IF NOT EXISTS idx_certificate_templates_program_id ON certificate_templates(program_id);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_active ON certificate_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_created_by ON certificate_templates(created_by);

-- Indexes for certificates
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_template_id ON certificates(template_id);
CREATE INDEX IF NOT EXISTS idx_certificates_program_id ON certificates(program_id);
CREATE INDEX IF NOT EXISTS idx_certificates_class_id ON certificates(class_id);
CREATE INDEX IF NOT EXISTS idx_certificates_recipient ON certificates(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates(issued_at);

-- Indexes for certificate_requirements
CREATE INDEX IF NOT EXISTS idx_certificate_requirements_program_id ON certificate_requirements(program_id);
CREATE INDEX IF NOT EXISTS idx_certificate_requirements_type ON certificate_requirements(requirement_type);
CREATE INDEX IF NOT EXISTS idx_certificate_requirements_active ON certificate_requirements(is_active);

-- Indexes for certificate_verifications
CREATE INDEX IF NOT EXISTS idx_certificate_verifications_certificate_id ON certificate_verifications(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificate_verifications_verified_at ON certificate_verifications(verified_at);

-- ============================================================================
-- STEP 6: CREATE FUNCTIONS FOR CERTIFICATE GENERATION
-- ============================================================================

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
    cert_number TEXT;
    counter INTEGER;
BEGIN
    -- Generate format: CERT-YYYY-MM-DD-XXXXXX
    SELECT COALESCE(MAX(CAST(SUBSTRING(certificate_number FROM 16) AS INTEGER)), 0) + 1
    INTO counter
    FROM certificates
    WHERE certificate_number LIKE 'CERT-' || TO_CHAR(NOW(), 'YYYY-MM-DD') || '-%';
    
    cert_number := 'CERT-' || TO_CHAR(NOW(), 'YYYY-MM-DD') || '-' || LPAD(counter::TEXT, 6, '0');
    
    RETURN cert_number;
END;
$$ LANGUAGE plpgsql;

-- Function to check if participant meets certificate requirements
CREATE OR REPLACE FUNCTION check_certificate_requirements(
    p_program_id UUID,
    p_participant_id UUID,
    p_class_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    requirement RECORD;
    total_contents INTEGER;
    completed_contents INTEGER;
    total_participants INTEGER;
    passed_participants INTEGER;
    pass_rate DECIMAL(5,2);
BEGIN
    -- Check all requirements for the program
    FOR requirement IN 
        SELECT * FROM certificate_requirements 
        WHERE program_id = p_program_id AND is_active = true
    LOOP
        CASE requirement.requirement_type
            WHEN 'completion_percentage' THEN
                -- Check if participant completed required percentage of content
                SELECT COUNT(*) INTO total_contents
                FROM learning_contents lc
                JOIN classes c ON lc.class_id = c.id
                WHERE c.program_id = p_program_id 
                AND lc.is_required = true 
                AND lc.status = 'published';
                
                SELECT COUNT(*) INTO completed_contents
                FROM learning_progress lp
                JOIN learning_contents lc ON lp.content_id = lc.id
                JOIN classes c ON lc.class_id = c.id
                WHERE c.program_id = p_program_id 
                AND lp.user_id = (SELECT user_id FROM participants WHERE id = p_participant_id)
                AND lp.status = 'completed';
                
                IF total_contents = 0 OR (completed_contents::DECIMAL / total_contents * 100) < requirement.requirement_value THEN
                    RETURN FALSE;
                END IF;
                
            WHEN 'all_activities' THEN
                -- Check if participant completed all required activities
                SELECT COUNT(*) INTO total_contents
                FROM learning_contents lc
                JOIN classes c ON lc.class_id = c.id
                WHERE c.program_id = p_program_id 
                AND lc.is_required = true 
                AND lc.status = 'published';
                
                SELECT COUNT(*) INTO completed_contents
                FROM learning_progress lp
                JOIN learning_contents lc ON lp.content_id = lc.id
                JOIN classes c ON lc.class_id = c.id
                WHERE c.program_id = p_program_id 
                AND lp.user_id = (SELECT user_id FROM participants WHERE id = p_participant_id)
                AND lp.status = 'completed';
                
                IF completed_contents < total_contents THEN
                    RETURN FALSE;
                END IF;
                
            WHEN 'min_participants' THEN
                -- Check if class has minimum participants (for trainer certificate)
                IF p_class_id IS NOT NULL THEN
                    SELECT current_participants INTO total_participants
                    FROM classes WHERE id = p_class_id;
                    
                    IF total_participants < requirement.requirement_value THEN
                        RETURN FALSE;
                    END IF;
                END IF;
                
            WHEN 'min_pass_rate' THEN
                -- Check if class has minimum pass rate (for trainer certificate)
                IF p_class_id IS NOT NULL THEN
                    SELECT COUNT(*) INTO total_participants
                    FROM enrollments e
                    JOIN participants p ON e.participant_id = p.id
                    WHERE e.class_id = p_class_id AND e.status = 'completed';
                    
                    SELECT COUNT(*) INTO passed_participants
                    FROM enrollments e
                    JOIN participants p ON e.participant_id = p.id
                    WHERE e.class_id = p_class_id AND e.status = 'completed'
                    AND e.certificate_issued = true;
                    
                    IF total_participants > 0 THEN
                        pass_rate := (passed_participants::DECIMAL / total_participants * 100);
                        IF pass_rate < requirement.requirement_value THEN
                            RETURN FALSE;
                        END IF;
                    END IF;
                END IF;
        END CASE;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate participant certificate (FIXED)
CREATE OR REPLACE FUNCTION auto_generate_participant_certificate(
    p_enrollment_id UUID
)
RETURNS UUID AS $$
DECLARE
    enrollment_record RECORD;
    template_record RECORD;
    certificate_id UUID;
    cert_number TEXT;
    qr_data TEXT;
    qr_url TEXT;
    pdf_url TEXT;
BEGIN
    -- Get enrollment details
    SELECT e.*, p.name as participant_name, p.company as participant_company, p.position as participant_position,
           pr.title as program_title, pr.start_date as program_start_date, pr.end_date as program_end_date,
           c.name as class_name
    INTO enrollment_record
    FROM enrollments e
    JOIN participants p ON e.participant_id = p.id
    JOIN programs pr ON e.program_id = pr.id
    LEFT JOIN classes c ON e.class_id = c.id
    WHERE e.id = p_enrollment_id;
    
    -- Check if certificate requirements are met
    IF NOT check_certificate_requirements(enrollment_record.program_id, enrollment_record.participant_id, enrollment_record.class_id) THEN
        RAISE EXCEPTION 'Certificate requirements not met';
    END IF;
    
    -- Get active template for the program
    SELECT * INTO template_record
    FROM certificate_templates
    WHERE program_id = enrollment_record.program_id AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active certificate template found for this program';
    END IF;
    
    -- Generate certificate number
    cert_number := generate_certificate_number();
    
    -- Generate QR code data
    qr_data := 'https://yourdomain.com/certificate/verify/' || cert_number;
    
    -- TODO: Generate actual PDF and QR code files
    -- For now, we'll use placeholder URLs
    pdf_url := 'https://yourdomain.com/certificates/' || cert_number || '.pdf';
    qr_url := 'https://yourdomain.com/qr-codes/' || cert_number || '.png';
    
    -- Create certificate record
    INSERT INTO certificates (
        certificate_number,
        template_id,
        program_id,
        class_id,
        recipient_type,
        recipient_id,
        recipient_name,
        recipient_company,
        recipient_position,
        program_title,
        program_start_date,
        program_end_date,
        completion_date,
        certificate_pdf_url,
        certificate_qr_code_url,
        qr_code_data,
        issued_by
    ) VALUES (
        cert_number,
        template_record.id,
        enrollment_record.program_id,
        enrollment_record.class_id,
        'participant',
        enrollment_record.participant_id,
        enrollment_record.participant_name,
        enrollment_record.participant_company,
        enrollment_record.participant_position,
        enrollment_record.program_title,
        enrollment_record.program_start_date,
        enrollment_record.program_end_date,
        NOW()::DATE,
        pdf_url,
        qr_url,
        qr_data,
        template_record.created_by
    ) RETURNING id INTO certificate_id;
    
    -- Update enrollment to mark certificate as issued
    UPDATE enrollments 
    SET certificate_issued = true, completion_date = NOW()
    WHERE id = p_enrollment_id;
    
    RETURN certificate_id;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate trainer certificate
CREATE OR REPLACE FUNCTION auto_generate_trainer_certificate(
    p_program_id UUID,
    p_trainer_id UUID,
    p_class_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    trainer_record RECORD;
    template_record RECORD;
    program_record RECORD;
    class_record RECORD;
    certificate_id UUID;
    cert_number TEXT;
    qr_data TEXT;
    qr_url TEXT;
    pdf_url TEXT;
BEGIN
    -- Get trainer details
    SELECT * INTO trainer_record
    FROM user_profiles
    WHERE id = p_trainer_id;
    
    -- Get program details
    SELECT * INTO program_record
    FROM programs
    WHERE id = p_program_id;
    
    -- Get class details if provided
    IF p_class_id IS NOT NULL THEN
        SELECT * INTO class_record
        FROM classes
        WHERE id = p_class_id;
    END IF;
    
    -- Check if certificate requirements are met
    IF NOT check_certificate_requirements(p_program_id, NULL, p_class_id) THEN
        RAISE EXCEPTION 'Certificate requirements not met';
    END IF;
    
    -- Get active template for the program
    SELECT * INTO template_record
    FROM certificate_templates
    WHERE program_id = p_program_id AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active certificate template found for this program';
    END IF;
    
    -- Generate certificate number
    cert_number := generate_certificate_number();
    
    -- Generate QR code data
    qr_data := 'https://yourdomain.com/certificate/verify/' || cert_number;
    
    -- TODO: Generate actual PDF and QR code files
    -- For now, we'll use placeholder URLs
    pdf_url := 'https://yourdomain.com/certificates/' || cert_number || '.pdf';
    qr_url := 'https://yourdomain.com/qr-codes/' || cert_number || '.png';
    
    -- Create certificate record
    INSERT INTO certificates (
        certificate_number,
        template_id,
        program_id,
        class_id,
        recipient_type,
        recipient_id,
        recipient_name,
        recipient_company,
        recipient_position,
        program_title,
        program_start_date,
        program_end_date,
        completion_date,
        trainer_name,
        trainer_level,
        certificate_pdf_url,
        certificate_qr_code_url,
        qr_code_data,
        issued_by
    ) VALUES (
        cert_number,
        template_record.id,
        p_program_id,
        p_class_id,
        'trainer',
        p_trainer_id,
        trainer_record.full_name,
        NULL, -- Company not applicable for trainers
        NULL, -- Position not applicable for trainers
        program_record.title,
        program_record.start_date,
        program_record.end_date,
        NOW()::DATE,
        trainer_record.full_name,
        trainer_record.trainer_level,
        pdf_url,
        qr_url,
        qr_data,
        template_record.created_by
    ) RETURNING id INTO certificate_id;
    
    RETURN certificate_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: CREATE TRIGGERS FOR AUTOMATIC CERTIFICATE GENERATION
-- ============================================================================

-- Trigger to auto-generate participant certificate when enrollment is completed
CREATE OR REPLACE FUNCTION trigger_auto_generate_participant_certificate()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate certificate if status changed to 'completed' and certificate not yet issued
    IF NEW.status = 'completed' AND NEW.certificate_issued = false THEN
        BEGIN
            PERFORM auto_generate_participant_certificate(NEW.id);
        EXCEPTION
            WHEN OTHERS THEN
                -- Log error but don't fail the transaction
                RAISE WARNING 'Failed to auto-generate certificate for enrollment %: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enrollment_certificate_generation
    AFTER UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_generate_participant_certificate();

-- ============================================================================
-- STEP 8: ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all certificate tables
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies for certificate_templates
CREATE POLICY "Certificate templates are viewable by everyone" ON certificate_templates FOR SELECT USING (true);
CREATE POLICY "Only admins can manage certificate templates" ON certificate_templates FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create policies for certificates
CREATE POLICY "Certificates are viewable by everyone" ON certificates FOR SELECT USING (true);
CREATE POLICY "Only admins can manage certificates" ON certificates FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create policies for certificate_requirements
CREATE POLICY "Certificate requirements are viewable by everyone" ON certificate_requirements FOR SELECT USING (true);
CREATE POLICY "Only admins can manage certificate requirements" ON certificate_requirements FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create policies for certificate_verifications
CREATE POLICY "Certificate verifications are viewable by everyone" ON certificate_verifications FOR SELECT USING (true);
CREATE POLICY "Anyone can create certificate verifications" ON certificate_verifications FOR INSERT WITH CHECK (true);

-- ============================================================================
-- STEP 9: CREATE SAMPLE DATA
-- ============================================================================

-- Insert sample certificate requirements for existing programs
INSERT INTO certificate_requirements (program_id, requirement_type, requirement_value, requirement_description)
SELECT 
    id,
    'completion_percentage',
    80.0,
    'Peserta harus menyelesaikan minimal 80% dari semua materi pembelajaran'
FROM programs 
WHERE status = 'published'
ON CONFLICT DO NOTHING;

-- Insert sample certificate requirements for trainer certificates
INSERT INTO certificate_requirements (program_id, requirement_type, requirement_value, requirement_description)
SELECT 
    id,
    'min_participants',
    50.0,
    'Kelas harus memiliki minimal 50 peserta'
FROM programs 
WHERE status = 'published'
ON CONFLICT DO NOTHING;

INSERT INTO certificate_requirements (program_id, requirement_type, requirement_value, requirement_description)
SELECT 
    id,
    'min_pass_rate',
    50.0,
    'Minimal 50% peserta harus lulus untuk trainer mendapat sertifikat'
FROM programs 
WHERE status = 'published'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 10: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION generate_certificate_number() TO authenticated;
GRANT EXECUTE ON FUNCTION check_certificate_requirements(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_generate_participant_certificate(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_generate_trainer_certificate(UUID, UUID, UUID) TO authenticated;

-- Grant permissions on tables
GRANT SELECT ON certificate_templates TO authenticated;
GRANT SELECT ON certificates TO authenticated;
GRANT SELECT ON certificate_requirements TO authenticated;
GRANT SELECT ON certificate_verifications TO authenticated;
GRANT INSERT ON certificate_verifications TO authenticated;

-- Grant admin permissions
GRANT ALL ON certificate_templates TO authenticated;
GRANT ALL ON certificates TO authenticated;
GRANT ALL ON certificate_requirements TO authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'Certificate system database schema created successfully!' as message;
