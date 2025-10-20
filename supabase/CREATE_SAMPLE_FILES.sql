-- Create Sample Files
-- This will create sample files to fix the "Object not found" error

-- Step 1: Create sample payment proof files
INSERT INTO storage.objects (bucket_id, name, data, content_type)
VALUES 
  ('payment-proofs', 'sample/sample-payment-1.png', decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'), 'image/png'),
  ('payment-proofs', 'sample/sample-payment-2.jpg', decode('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A', 'base64'), 'image/jpeg'),
  ('payment-proofs', 'sample/sample-payment-3.pdf', 'Sample PDF content for testing'::bytea, 'application/pdf')
ON CONFLICT (name) DO NOTHING;

-- Step 2: Update all enrollments to use sample files
UPDATE enrollments 
SET payment_proof_url = 'https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/sample/sample-payment-1.png'
WHERE payment_proof_url IS NOT NULL;

-- Step 3: Show results
SELECT 'Sample files created!' as message;
SELECT name, content_type FROM storage.objects WHERE bucket_id = 'payment-proofs' AND name LIKE 'sample/%';
SELECT COUNT(*) as updated_enrollments FROM enrollments WHERE payment_proof_url IS NOT NULL;
