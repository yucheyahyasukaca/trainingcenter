-- Add email signature fields to email_templates table
-- This allows users to customize email signatures with logo and contact information

ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS signature_logo_url TEXT,
ADD COLUMN IF NOT EXISTS signature_name TEXT,
ADD COLUMN IF NOT EXISTS signature_title TEXT,
ADD COLUMN IF NOT EXISTS signature_email TEXT,
ADD COLUMN IF NOT EXISTS signature_phone TEXT,
ADD COLUMN IF NOT EXISTS signature_website TEXT,
ADD COLUMN IF NOT EXISTS signature_address TEXT,
ADD COLUMN IF NOT EXISTS signature_enabled BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN email_templates.signature_logo_url IS 'URL to the signature logo image';
COMMENT ON COLUMN email_templates.signature_name IS 'Name to display in signature';
COMMENT ON COLUMN email_templates.signature_title IS 'Job title/position in signature';
COMMENT ON COLUMN email_templates.signature_email IS 'Email address in signature';
COMMENT ON COLUMN email_templates.signature_phone IS 'Phone number in signature';
COMMENT ON COLUMN email_templates.signature_website IS 'Website URL in signature';
COMMENT ON COLUMN email_templates.signature_address IS 'Physical address in signature';
COMMENT ON COLUMN email_templates.signature_enabled IS 'Whether to include signature in emails';

