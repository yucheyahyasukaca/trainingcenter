-- Enable RLS
alter table "public"."participants" enable row level security;

-- Drop existing policies if any to avoid conflicts (optional, but safer to use unique names or check existence)
-- For simplicity, I'll use unique names or just create them.

create policy "Admins and Managers can view all participants"
on "public"."participants"
for select
to authenticated
using (
  auth.jwt() ->> 'role' = 'service_role' OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin' OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'manager' OR
  (select role from user_profiles where id = auth.uid()) in ('admin', 'manager')
);

create policy "Admins and Managers can insert participants"
on "public"."participants"
for insert
to authenticated
with check (
  auth.jwt() ->> 'role' = 'service_role' OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin' OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'manager' OR
  (select role from user_profiles where id = auth.uid()) in ('admin', 'manager')
);

create policy "Admins and Managers can update participants"
on "public"."participants"
for update
to authenticated
using (
  auth.jwt() ->> 'role' = 'service_role' OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin' OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'manager' OR
  (select role from user_profiles where id = auth.uid()) in ('admin', 'manager')
);

create policy "Admins and Managers can delete participants"
on "public"."participants"
for delete
to authenticated
using (
  auth.jwt() ->> 'role' = 'service_role' OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin' OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'manager' OR
  (select role from user_profiles where id = auth.uid()) in ('admin', 'manager')
);
