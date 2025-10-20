-- Ultra Simple Storage Fix
-- Step by step to avoid any errors

-- Step 1: Check current bucket status
SELECT 'Step 1: Checking bucket status' as step;
SELECT id, name, public FROM storage.buckets WHERE id = 'payment-proofs';

-- Step 2: Create bucket if not exists (simplest way)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Make bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'payment-proofs';

-- Step 4: Check result
SELECT 'Step 4: Bucket updated' as step;
SELECT id, name, public FROM storage.buckets WHERE id = 'payment-proofs';

-- Step 5: Create simple policy (one at a time)
DROP POLICY IF EXISTS "payment_proofs_all" ON storage.objects;

-- Step 6: Create new policy
CREATE POLICY "payment_proofs_all" ON storage.objects
FOR ALL USING (bucket_id = 'payment-proofs');

-- Step 7: Final check
SELECT 'Step 7: Fix completed' as step;
SELECT 'SUCCESS: Storage should now work!' as message;
