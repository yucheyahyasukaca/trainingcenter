-- Add default forum categories for all programs
-- Run this after COMPLETE_FORUM_SETUP.sql

-- Add default categories for all published programs
INSERT INTO forum_categories (program_id, name, description)
SELECT 
  id,
  'Perkenalan',
  'Forum perkenalan dan sapa-sapa untuk peserta program ' || title
FROM programs 
WHERE status = 'published'
ON CONFLICT DO NOTHING;

INSERT INTO forum_categories (program_id, name, description)
SELECT 
  id,
  'Konsultasi & Pertanyaan',
  'Forum konsultasi dan tanya jawab untuk program ' || title
FROM programs 
WHERE status = 'published'
ON CONFLICT DO NOTHING;

-- Update existing "Diskusi Umum" category description
UPDATE forum_categories 
SET description = 'Forum diskusi umum untuk program ' || (
  SELECT title FROM programs WHERE programs.id = forum_categories.program_id
)
WHERE name = 'Diskusi Umum';

-- Verify the categories were created
SELECT 
  fc.name as category_name,
  fc.description,
  p.title as program_title
FROM forum_categories fc
JOIN programs p ON p.id = fc.program_id
WHERE p.status = 'published'
ORDER BY p.title, fc.name;
