-- Add platform field to webinars table
alter table public.webinars add column if not exists platform text check (platform in ('microsoft-teams', 'google-meet', 'zoom'));

