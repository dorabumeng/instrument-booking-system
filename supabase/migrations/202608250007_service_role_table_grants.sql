-- The service_role JWT bypasses RLS, but PostgreSQL table privileges are still
-- required. Keep these grants explicit and minimal for trusted server-side
-- administration and staging test fixture lifecycle operations.

grant usage on schema public to service_role;

-- Reset possible environment drift before establishing the intended baseline.
revoke all privileges on table
  public.profiles,
  public.instruments,
  public.bookings,
  public.audit_logs
from service_role;

-- Trusted role/bootstrap operations need profile lookup and role updates.
-- Profile creation/deletion continues through Supabase Auth and its trigger.
grant select, update on table public.profiles to service_role;

-- Trusted staging setup and cleanup needs a complete instrument/booking fixture
-- lifecycle. Existing constraints and triggers remain active for these writes.
grant select, insert, update, delete on table public.instruments to service_role;
grant select, insert, update, delete on table public.bookings to service_role;

-- Audit rows remain append-only through SECURITY DEFINER audit triggers.
-- Even service-role Data API clients receive read-only access.
grant select on table public.audit_logs to service_role;

comment on table public.audit_logs is
  'Append-only through privileged database triggers. authenticated clients cannot write; service_role has SELECT only through the Data API.';
