-- ============================================================================
-- ADD ATTACHMENT COLUMNS TO FORUM TABLES
-- Menambahkan kolom attachment_url ke tabel forum_threads dan forum_replies
-- ============================================================================

-- Add attachment_url column to forum_threads table
ALTER TABLE forum_threads 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Add attachment_url column to forum_replies table  
ALTER TABLE forum_replies
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN forum_threads.attachment_url IS 'URL or base64 data for thread attachments (images, documents)';
COMMENT ON COLUMN forum_replies.attachment_url IS 'URL or base64 data for reply attachments (images, documents)';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✓ Attachment columns added successfully!';
    RAISE NOTICE '✓ forum_threads.attachment_url - Added';
    RAISE NOTICE '✓ forum_replies.attachment_url - Added';
    RAISE NOTICE '✓ Comments added for documentation';
END $$;
