-- Quick URL Fix
-- Ensure all payment proof URLs are correct

-- Update all enrollments to use the correct URL
UPDATE enrollments 
SET payment_proof_url = 'https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/0ade6a79-7c6f-4097-9d03-c8ffea9d43be/0ade6a79-7c6f-4097-9d03-c8ffea9d43be_550e8400-e29b-41d4-a716-446655440004_1760948922911.png'
WHERE payment_proof_url IS NOT NULL;

-- Show result
SELECT 'URLs fixed!' as message;
SELECT id, payment_proof_url FROM enrollments WHERE payment_proof_url IS NOT NULL LIMIT 3;
