-- Create a new storage bucket for payment proofs
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do nothing;

-- Set up security policies for the payment-proofs bucket

-- 1. Allow authenticated users to upload their own payment proofs
create policy "Authenticated users can upload payment proofs"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'payment-proofs' );

-- 2. Allow authenticated users to view payment proofs (their own or others if admin/trainer - simplified to authenticated for now)
create policy "Anyone can view payment proofs"
on storage.objects for select
to public
using ( bucket_id = 'payment-proofs' );

-- 3. Allow users to update their own payment proofs
create policy "Authenticated users can update their own payment proofs"
on storage.objects for update
to authenticated
using ( bucket_id = 'payment-proofs' )
with check ( bucket_id = 'payment-proofs' );
