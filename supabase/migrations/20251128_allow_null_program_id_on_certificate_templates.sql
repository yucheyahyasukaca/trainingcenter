-- Allow certificate templates without a linked program (e.g., webinar templates)
ALTER TABLE certificate_templates
  ALTER COLUMN program_id DROP NOT NULL;