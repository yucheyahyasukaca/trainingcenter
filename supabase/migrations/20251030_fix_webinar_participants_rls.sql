-- Fix RLS policies for webinar_participants
-- The issue is that when using service role key, auth.uid() is NULL
-- So we need to ensure the policy works correctly

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

-- Also allow service role to bypass RLS (for admin operations)
-- Note: Service role key automatically bypasses RLS, but we add this for clarity
-- Actually, service role bypasses RLS by default, so this is just for documentation

