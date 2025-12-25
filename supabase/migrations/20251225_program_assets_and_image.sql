-- Create program-assets bucket
insert into storage.buckets (id, name, public)
values ('program-assets', 'program-assets', true)
on conflict (id) do nothing;

-- Policies for program-assets
drop policy if exists "Public read program assets" on storage.objects;
create policy "Public read program assets"
on storage.objects for select to public
using (bucket_id = 'program-assets');

drop policy if exists "Authenticated upload program assets" on storage.objects;
create policy "Authenticated upload program assets"
on storage.objects for insert to authenticated
with check (bucket_id = 'program-assets');

drop policy if exists "Authenticated update own program assets" on storage.objects;
create policy "Authenticated update own program assets"
on storage.objects for update to authenticated
using (bucket_id = 'program-assets');

-- Add image_url to programs if not exists
alter table programs add column if not exists image_url text;
