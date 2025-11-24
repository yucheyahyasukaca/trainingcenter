-- Add header image field to email_templates table
-- Store header image URL for email templates

ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS header_image_url TEXT;

-- Add comment
COMMENT ON COLUMN email_templates.header_image_url IS 'URL gambar header yang akan ditampilkan di atas konten email (logo atau banner kegiatan)';

