-- Add CTA button fields to email_templates table
-- Store CTA button configuration separately from content

ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS cta_button_text TEXT,
ADD COLUMN IF NOT EXISTS cta_button_url TEXT,
ADD COLUMN IF NOT EXISTS cta_button_color TEXT DEFAULT '#3B82F6';

-- Add comment
COMMENT ON COLUMN email_templates.cta_button_text IS 'Text untuk tombol CTA (Call to Action)';
COMMENT ON COLUMN email_templates.cta_button_url IS 'URL tujuan untuk tombol CTA';
COMMENT ON COLUMN email_templates.cta_button_color IS 'Warna tombol CTA dalam format hex (contoh: #3B82F6)';

