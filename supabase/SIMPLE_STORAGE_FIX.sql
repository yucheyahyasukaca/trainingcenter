-- Simple Storage Fix - No errors guaranteed
-- Step by step approach

-- Step 1: Just make sure bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'payment-proofs';

-- Step 2: Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Show result
SELECT 'Storage fix completed!' as message;
SELECT id, name, public FROM storage.buckets WHERE id = 'payment-proofs';
