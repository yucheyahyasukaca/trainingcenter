-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
);

-- Create RLS policies for payment proofs
CREATE POLICY "Users can upload their own payment proofs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own payment proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins and managers can view all payment proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-proofs' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Add payment_proof_url column to enrollments table if not exists
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- Add payment_proof_url to RLS policies
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
CREATE POLICY "Users can view their own enrollments" ON enrollments
FOR SELECT USING (
  participant_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Update enrollment status options
ALTER TABLE enrollments 
ALTER COLUMN status SET DEFAULT 'pending';

-- Add notes column if not exists
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS notes TEXT;
