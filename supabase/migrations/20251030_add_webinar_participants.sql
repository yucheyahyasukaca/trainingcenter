-- Add table for webinar participants uploaded by admin (without user account)
-- This allows participants to download certificates without logging in

CREATE TABLE IF NOT EXISTS public.webinar_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id UUID NOT NULL REFERENCES public.webinars(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  unit_kerja TEXT, -- Company/unit kerja
  email TEXT, -- Optional email
  phone TEXT, -- Optional phone
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (webinar_id, full_name, unit_kerja) -- Prevent duplicates
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_webinar_participants_webinar_id ON public.webinar_participants(webinar_id);
CREATE INDEX IF NOT EXISTS idx_webinar_participants_name ON public.webinar_participants(full_name);

-- Enable RLS
ALTER TABLE public.webinar_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Admins manage webinar participants" ON public.webinar_participants;
DROP POLICY IF EXISTS "Public read webinar participants" ON public.webinar_participants;

-- Admins can do everything
-- Note: This policy requires auth.uid() to be set (user session), not service role
CREATE POLICY "Admins manage webinar participants" ON public.webinar_participants
  FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Public can read (for certificate search)
CREATE POLICY "Public read webinar participants" ON public.webinar_participants
  FOR SELECT
  USING (true);

-- Modify webinar_certificates to support participants without user_id
-- Add participant_id column to link to webinar_participants
ALTER TABLE public.webinar_certificates
  ADD COLUMN IF NOT EXISTS participant_id UUID REFERENCES public.webinar_participants(id) ON DELETE CASCADE;

-- Make user_id nullable (since we now support participants without user account)
ALTER TABLE public.webinar_certificates
  ALTER COLUMN user_id DROP NOT NULL;

-- Add constraint: either user_id or participant_id must be set
-- Drop constraint first if it exists
ALTER TABLE public.webinar_certificates
  DROP CONSTRAINT IF EXISTS webinar_certificates_user_or_participant_check;

ALTER TABLE public.webinar_certificates
  ADD CONSTRAINT webinar_certificates_user_or_participant_check
  CHECK (
    (user_id IS NOT NULL AND participant_id IS NULL) OR
    (user_id IS NULL AND participant_id IS NOT NULL)
  );

-- Add index for participant_id
CREATE INDEX IF NOT EXISTS idx_webinar_certificates_participant_id ON public.webinar_certificates(participant_id);

