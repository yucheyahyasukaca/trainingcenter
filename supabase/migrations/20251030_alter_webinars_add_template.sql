alter table public.webinars
add column if not exists certificate_template_id uuid references public.certificate_templates(id) on delete set null;


