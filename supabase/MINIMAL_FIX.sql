-- Minimal Fix - Just one command
UPDATE storage.buckets SET public = true WHERE id = 'payment-proofs';
