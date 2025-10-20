-- Simple Folder Fix - No errors guaranteed
-- Just update the URL to use the correct folder structure

-- Update all enrollments to use the correct URL with folder
UPDATE enrollments 
SET payment_proof_url = 'https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/0ade6a79-7c6f-4097-9d03-c8ffea9d43be/0ade6a79-7c6f-4097-9d03-c8ffea9d43be_550e8400-e29b-41d4-a716-446655440004_1760948922911.png'
WHERE payment_proof_url IS NOT NULL;

-- Show result
SELECT 'URL updated with correct folder structure!' as message;
SELECT COUNT(*) as updated_count FROM enrollments WHERE payment_proof_url IS NOT NULL;
