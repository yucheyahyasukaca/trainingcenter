-- Add location field for offline (luring) webinars
ALTER TABLE public.webinars
ADD COLUMN IF NOT EXISTS location TEXT;

COMMENT ON COLUMN public.webinars.location IS 'Location/venue for offline (luring) webinars';