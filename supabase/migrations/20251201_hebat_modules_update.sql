-- Add rich content fields to hebat_modules
ALTER TABLE hebat_modules 
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS content_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS material_type TEXT DEFAULT 'main',
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_expanded BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES hebat_modules(id) ON DELETE CASCADE;

-- Update existing rows to have default values
UPDATE hebat_modules SET 
    content_type = 'text',
    content_data = jsonb_build_object('body', content),
    status = CASE WHEN is_published THEN 'published' ELSE 'draft' END
WHERE content_data = '{}'::jsonb;
