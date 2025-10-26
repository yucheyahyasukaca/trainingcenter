-- Update Template Fields Structure for Position, Font, and QR Code Configuration
-- Jalankan script ini di Supabase SQL Editor

-- ============================================================================
-- STEP 1: ADD NEW COLUMNS TO CERTIFICATE TEMPLATES TABLE
-- ============================================================================

-- Add fields for QR code configuration
ALTER TABLE certificate_templates
ADD COLUMN IF NOT EXISTS qr_code_size INTEGER DEFAULT 150,
ADD COLUMN IF NOT EXISTS qr_code_position_x DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS qr_code_position_y DECIMAL(10,2);

-- ============================================================================
-- STEP 2: UPDATE TEMPLATE_FIELDS STRUCTURE
-- ============================================================================

-- The template_fields JSONB will now support:
-- {
--   "field_name": {
--     "value": "text or variable",
--     "position": { "x": 100, "y": 100 },
--     "font": { "family": "Arial", "size": 12, "weight": "normal", "color": "#000000" },
--     "width": 200,
--     "align": "left" // left, center, right
--   }
-- }

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'Template fields structure updated successfully!' as message;
