-- Webinars core tables
create table if not exists public.webinars (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  hero_image_url text, -- admin uploads; placeholder on UI if null
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webinar_speakers (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references public.webinars(id) on delete cascade,
  name text not null,
  title text,
  avatar_url text, -- admin uploads
  bio text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.webinar_registrations (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references public.webinars(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  registered_at timestamptz not null default now(),
  attended boolean, -- optional flag if you track attendance
  unique (webinar_id, user_id)
);

create table if not exists public.webinar_recordings (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references public.webinars(id) on delete cascade,
  recording_url text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

-- Optional: certificate linkage for webinars
-- Stores issuance per registration; you may already have certificates tables, so keep this isolated
create table if not exists public.webinar_certificates (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references public.webinars(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  certificate_number text unique not null,
  pdf_url text,
  qr_code_url text,
  issued_at timestamptz not null default now(),
  unique (webinar_id, user_id)
);

-- Indexes
create index if not exists idx_webinars_published_time on public.webinars (is_published, start_time desc);
create index if not exists idx_webinar_speakers_webinar on public.webinar_speakers (webinar_id, sort_order);
create index if not exists idx_webinar_registrations_user on public.webinar_registrations (user_id);
create index if not exists idx_webinar_recordings_webinar on public.webinar_recordings (webinar_id);
create index if not exists idx_webinar_certificates_user on public.webinar_certificates (user_id);

-- RLS enablement (policies added in separate file)
alter table public.webinars enable row level security;
alter table public.webinar_speakers enable row level security;
alter table public.webinar_registrations enable row level security;
alter table public.webinar_recordings enable row level security;
alter table public.webinar_certificates enable row level security;

-- Updated at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_webinars_updated_at on public.webinars;
create trigger set_webinars_updated_at
before update on public.webinars
for each row execute procedure public.set_updated_at();


