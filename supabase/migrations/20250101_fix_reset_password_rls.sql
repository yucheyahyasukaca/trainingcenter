-- Fix RLS for reset password functionality
-- This ensures service role can access user_profiles for password reset

-- Drop existing service role policy if exists
DROP POLICY IF EXISTS "Service role can access all profiles" ON user_profiles;

-- Create policy for service role to access all profiles
-- Service role bypasses RLS by default, but this ensures compatibility
CREATE POLICY "Service role can access all profiles" ON user_profiles
    FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Also allow service role to access participants table
DROP POLICY IF EXISTS "Service role can access all participants" ON participants;
CREATE POLICY "Service role can access all participants" ON participants
    FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

