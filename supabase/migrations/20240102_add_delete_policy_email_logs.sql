-- Add DELETE policy for email_logs table
-- This allows admins to delete email logs

CREATE POLICY "Admins can delete email logs" 
  ON email_logs 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

