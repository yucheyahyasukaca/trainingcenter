-- Create email_recipients table for individual email tracking
CREATE TABLE IF NOT EXISTS email_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_log_id UUID REFERENCES email_logs(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'failed', 'bounced')),
  message_id TEXT, -- SMTP message ID
  error_message TEXT, -- Error message if failed
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_email_recipients_log_id ON email_recipients(email_log_id);
CREATE INDEX IF NOT EXISTS idx_email_recipients_email ON email_recipients(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_recipients_status ON email_recipients(status);

-- Add RLS policies
ALTER TABLE email_recipients ENABLE ROW LEVEL SECURITY;

-- Only admins can view recipients
CREATE POLICY "Admins can view email recipients" 
  ON email_recipients 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Only admins can insert/update recipients
CREATE POLICY "Admins can manage email recipients" 
  ON email_recipients 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Add function to update email_logs status based on recipients
CREATE OR REPLACE FUNCTION update_email_log_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update email_logs status based on recipients status
  UPDATE email_logs
  SET 
    status = CASE
      WHEN EXISTS (
        SELECT 1 FROM email_recipients 
        WHERE email_log_id = NEW.email_log_id 
        AND status = 'failed'
      ) THEN 'failed'
      WHEN EXISTS (
        SELECT 1 FROM email_recipients 
        WHERE email_log_id = NEW.email_log_id 
        AND status IN ('pending', 'queued')
      ) THEN 'queued'
      WHEN EXISTS (
        SELECT 1 FROM email_recipients 
        WHERE email_log_id = NEW.email_log_id 
        AND status = 'sent'
      ) THEN 'sent'
      WHEN NOT EXISTS (
        SELECT 1 FROM email_recipients 
        WHERE email_log_id = NEW.email_log_id 
        AND status IN ('pending', 'queued', 'sent')
      ) THEN 'sent'
      ELSE 'sent'
    END,
    recipient_count = (
      SELECT COUNT(*) FROM email_recipients 
      WHERE email_log_id = NEW.email_log_id
    )
  WHERE id = NEW.email_log_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update email_logs status
CREATE TRIGGER trigger_update_email_log_status
  AFTER INSERT OR UPDATE ON email_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_email_log_status();

