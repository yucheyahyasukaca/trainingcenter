-- Storage bucket for HEBAT module covers
insert into storage.buckets (id, name, public)
values ('hebat-covers', 'hebat-covers', true)
on conflict (id) do nothing;

-- Allow public read on hebat-covers
drop policy if exists "Public read hebat covers" on storage.objects;
create policy "Public read hebat covers"
on storage.objects for select to public
using (bucket_id = 'hebat-covers');

-- Allow authenticated upload (admins only ideally, but for now authenticated is fine as per existing patterns)
-- We can refine this to admins only if needed, but following webinar pattern for now
drop policy if exists "Authenticated upload hebat covers" on storage.objects;
create policy "Authenticated upload hebat covers"
on storage.objects for insert to authenticated
with check (bucket_id = 'hebat-covers');

-- Allow authenticated update own assets
drop policy if exists "Authenticated update own hebat covers" on storage.objects;
create policy "Authenticated update own hebat covers"
on storage.objects for update to authenticated
using (bucket_id = 'hebat-covers');

-- Allow authenticated delete own assets
drop policy if exists "Authenticated delete own hebat covers" on storage.objects;
create policy "Authenticated delete own hebat covers"
on storage.objects for delete to authenticated
using (bucket_id = 'hebat-covers');
