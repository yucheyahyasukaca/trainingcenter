-- Fix Existing Payment Proof URLs
-- Convert signed URLs to public URLs

-- Update enrollments with signed URLs to use public URLs
UPDATE enrollments 
SET payment_proof_url = 'https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/' || 
  substring(payment_proof_url from 'payment-proofs/(.*)$')
WHERE payment_proof_url IS NOT NULL 
AND payment_proof_url LIKE '%object/sign%';

-- Update enrollments with other problematic URLs
UPDATE enrollments 
SET payment_proof_url = 'https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/' || 
  substring(payment_proof_url from 'payment-proofs/(.*)$')
WHERE payment_proof_url IS NOT NULL 
AND payment_proof_url NOT LIKE '%supabase.garuda-21.com/storage/v1/object/public/%';

-- Show results
SELECT 'URLs fixed!' as message;
SELECT id, payment_proof_url FROM enrollments WHERE payment_proof_url IS NOT NULL LIMIT 5;
