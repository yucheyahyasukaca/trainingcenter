-- Add 'luring' option to platform constraint in webinars table
-- Run this migration to add support for offline (luring) webinars

-- First, drop the existing constraint
ALTER TABLE public.webinars 
DROP CONSTRAINT IF EXISTS webinars_platform_check;

-- Add new constraint with 'luring' option
ALTER TABLE public.webinars 
ADD CONSTRAINT webinars_platform_check 
CHECK (platform IS NULL OR platform IN ('microsoft-teams', 'google-meet', 'zoom', 'luring'));

