-- Fix RLS policies for webinar_participants (Standalone - can be run multiple times)
-- Run this if you get "policy already exists" error

-- Drop existing policies
DROP POLICY IF EXISTS "Admins manage webinar participants" ON public.webinar_participants;
DROP POLICY IF EXISTS "Public read webinar participants" ON public.webinar_participants;

-- Recreate admin policy with better check
-- This policy allows authenticated users with admin role to do everything
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

