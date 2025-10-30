-- Allow public to read registration count (but not individual data)
-- This enables the participant count display on landing pages

drop policy if exists "Public read registration count" on public.webinar_registrations;
create policy "Public read registration count" on public.webinar_registrations
for select to public using (
  exists (
    select 1 from public.webinars w where w.id = webinar_id and w.is_published = true
  )
);

