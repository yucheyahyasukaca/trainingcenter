-- Fix RLS policies for referral_codes table
-- Run this script in Supabase SQL Editor

-- First, let's check if the table exists and its structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'referral_codes' 
ORDER BY ordinal_position;

-- Enable RLS on referral_codes table
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own referral codes" ON referral_codes;
DROP POLICY IF EXISTS "Users can insert their own referral codes" ON referral_codes;
DROP POLICY IF EXISTS "Users can update their own referral codes" ON referral_codes;
DROP POLICY IF EXISTS "Users can delete their own referral codes" ON referral_codes;

-- Create RLS policies for referral_codes

-- Policy for SELECT (view referral codes)
CREATE POLICY "Users can view their own referral codes" ON referral_codes
FOR SELECT USING (
  trainer_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Policy for INSERT (create referral codes)
CREATE POLICY "Users can insert their own referral codes" ON referral_codes
FOR INSERT WITH CHECK (
  trainer_id = auth.uid()
);

-- Policy for UPDATE (update referral codes)
CREATE POLICY "Users can update their own referral codes" ON referral_codes
FOR UPDATE USING (
  trainer_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Policy for DELETE (delete referral codes)
CREATE POLICY "Users can delete their own referral codes" ON referral_codes
FOR DELETE USING (
  trainer_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Also create policies for referral_tracking table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_tracking') THEN
        -- Enable RLS on referral_tracking table
        ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view their own referral tracking" ON referral_tracking;
        DROP POLICY IF EXISTS "Users can insert their own referral tracking" ON referral_tracking;
        DROP POLICY IF EXISTS "Users can update their own referral tracking" ON referral_tracking;
        DROP POLICY IF EXISTS "Users can delete their own referral tracking" ON referral_tracking;
        
        -- Create RLS policies for referral_tracking
        CREATE POLICY "Users can view their own referral tracking" ON referral_tracking
        FOR SELECT USING (
          trainer_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'manager')
          )
        );
        
        CREATE POLICY "Users can insert their own referral tracking" ON referral_tracking
        FOR INSERT WITH CHECK (
          trainer_id = auth.uid()
        );
        
        CREATE POLICY "Users can update their own referral tracking" ON referral_tracking
        FOR UPDATE USING (
          trainer_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'manager')
          )
        );
        
        CREATE POLICY "Users can delete their own referral tracking" ON referral_tracking
        FOR DELETE USING (
          trainer_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'manager')
          )
        );
        
        RAISE NOTICE 'RLS policies created for referral_tracking table';
    ELSE
        RAISE NOTICE 'referral_tracking table does not exist, skipping...';
    END IF;
END $$;

-- Test the policies by checking if we can access the table
SELECT 'RLS policies for referral_codes table have been created successfully!' as message;
