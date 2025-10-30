-- Storage bucket for webinar assets
insert into storage.buckets (id, name, public)
values ('webinar-assets', 'webinar-assets', true)
on conflict (id) do nothing;

-- Allow public read on webinar-assets; authenticated write
drop policy if exists "Public read webinar assets" on storage.objects;
create policy "Public read webinar assets"
on storage.objects for select to public
using (bucket_id = 'webinar-assets');

drop policy if exists "Authenticated upload webinar assets" on storage.objects;
create policy "Authenticated upload webinar assets"
on storage.objects for insert to authenticated
with check (bucket_id = 'webinar-assets');

drop policy if exists "Authenticated update own webinar assets" on storage.objects;
create policy "Authenticated update own webinar assets"
on storage.objects for update to authenticated
using (bucket_id = 'webinar-assets');

-- RLS Policies for webinars
-- Webinars are publicly readable when published
drop policy if exists "Public read published webinars" on public.webinars;
create policy "Public read published webinars" on public.webinars
for select to public using (is_published = true);

-- Authenticated users can read all to enable admin UIs (tighten if you have roles)
drop policy if exists "Auth read webinars" on public.webinars;
create policy "Auth read webinars" on public.webinars
for select to authenticated using (true);

-- Only admins (role stored on user_profiles.role) or creator can insert/update/delete
-- Adjust according to your existing role system
drop policy if exists "Admins insert webinars" on public.webinars;
create policy "Admins insert webinars" on public.webinars
for insert to authenticated
with check (
  exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.role in ('admin')
  )
);

drop policy if exists "Admins update webinars" on public.webinars;
create policy "Admins update webinars" on public.webinars
for update to authenticated
using (
  exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.role in ('admin')
  ) or created_by = auth.uid()
)
with check (
  exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.role in ('admin')
  ) or created_by = auth.uid()
);

drop policy if exists "Admins delete webinars" on public.webinars;
create policy "Admins delete webinars" on public.webinars
for delete to authenticated
using (
  exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.role in ('admin')
  ) or created_by = auth.uid()
);

-- Speakers: public read for published, admin manage
drop policy if exists "Public read webinar speakers" on public.webinar_speakers;
create policy "Public read webinar speakers" on public.webinar_speakers
for select to public using (
  exists (
    select 1 from public.webinars w where w.id = webinar_id and w.is_published = true
  )
);

drop policy if exists "Auth read speakers" on public.webinar_speakers;
create policy "Auth read speakers" on public.webinar_speakers
for select to authenticated using (true);

drop policy if exists "Admins manage speakers" on public.webinar_speakers;
create policy "Admins manage speakers" on public.webinar_speakers
for all to authenticated using (
  exists (
    select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin')
  )
) with check (
  exists (
    select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin')
  )
);

-- Registrations: users can manage their own
drop policy if exists "Users read own and published webinar registrations" on public.webinar_registrations;
create policy "Users read own and published webinar registrations" on public.webinar_registrations
for select to authenticated using (
  user_id = auth.uid()
);

-- Admins can read all registrations
drop policy if exists "Admins read all webinar registrations" on public.webinar_registrations;
create policy "Admins read all webinar registrations" on public.webinar_registrations
for select to authenticated using (
  exists (
    select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin')
  )
);

drop policy if exists "Users register themselves" on public.webinar_registrations;
create policy "Users register themselves" on public.webinar_registrations
for insert to authenticated with check (user_id = auth.uid());

-- Recordings: public if webinar is public and recording marked public, else registered users
drop policy if exists "Public read public recordings" on public.webinar_recordings;
create policy "Public read public recordings" on public.webinar_recordings
for select to public using (
  is_public = true and exists (
    select 1 from public.webinars w where w.id = webinar_id and w.is_published = true
  )
);

drop policy if exists "Registered users read private recordings" on public.webinar_recordings;
create policy "Registered users read private recordings" on public.webinar_recordings
for select to authenticated using (
  exists (
    select 1 from public.webinar_registrations r where r.webinar_id = webinar_id and r.user_id = auth.uid()
  )
);

-- Certificates: users see their own
drop policy if exists "Users read own webinar certificates" on public.webinar_certificates;
create policy "Users read own webinar certificates" on public.webinar_certificates
for select to authenticated using (user_id = auth.uid());

-- Admins manage certificates
drop policy if exists "Admins manage webinar certificates" on public.webinar_certificates;
create policy "Admins manage webinar certificates" on public.webinar_certificates
for all to authenticated using (
  exists (
    select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin')
  )
) with check (
  exists (
    select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin')
  )
);


