alter table public.profiles enable row level security;
alter table public.instruments enable row level security;
alter table public.bookings enable row level security;

revoke all on table public.profiles, public.instruments, public.bookings from anon, authenticated;
grant select, update on table public.profiles to authenticated;
grant select on table public.instruments to authenticated;
grant insert, update, delete on table public.instruments to authenticated;
grant select, insert, update, delete on table public.bookings to authenticated;

create policy profiles_select_own_or_admin on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.is_admin()));
create policy profiles_update_own on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_update_admin on public.profiles for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

create policy instruments_select_authenticated on public.instruments for select to authenticated using (true);
create policy instruments_insert_admin on public.instruments for insert to authenticated with check ((select private.is_admin()));
create policy instruments_update_admin on public.instruments for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy instruments_delete_admin on public.instruments for delete to authenticated using ((select private.is_admin()));

create policy bookings_select_own_or_admin on public.bookings for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy bookings_insert_own on public.bookings for insert to authenticated
with check (user_id = (select auth.uid()) and status = 'confirmed'::public.booking_status);
create policy bookings_insert_admin on public.bookings for insert to authenticated
with check ((select private.is_admin()));
create policy bookings_update_own_future on public.bookings for update to authenticated
using (user_id = (select auth.uid()) and status = 'confirmed'::public.booking_status and start_time > now())
with check (user_id = (select auth.uid()) and start_time > now() and status in ('confirmed'::public.booking_status, 'cancelled'::public.booking_status));
create policy bookings_update_admin on public.bookings for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
create policy bookings_delete_admin on public.bookings for delete to authenticated
using ((select private.is_admin()));

-- Deliberately returns no sample, purpose, notes, user ID, or profile data.
-- SECURITY DEFINER is required because bookings RLS hides other users' rows.
create or replace function public.get_instrument_availability(
  requested_instrument_id uuid,
  range_start timestamptz,
  range_end timestamptz
)
returns table (booking_id uuid, instrument_id uuid, start_time timestamptz, end_time timestamptz, status public.booking_status)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  if range_end <= range_start or range_end - range_start > interval '93 days' then
    raise exception using errcode = '22023', message = 'Invalid availability range';
  end if;
  return query
    select b.id, b.instrument_id, b.start_time, b.end_time, b.status
    from public.bookings b
    where b.instrument_id = requested_instrument_id
      and b.status = 'confirmed'::public.booking_status
      and b.start_time < range_end and b.end_time > range_start
    order by b.start_time;
end;
$$;

revoke all on function public.get_instrument_availability(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.get_instrument_availability(uuid, timestamptz, timestamptz) to authenticated;
comment on function public.get_instrument_availability(uuid, timestamptz, timestamptz) is
  'Privacy boundary for calendars: authenticated callers receive occupied ranges only, never booking or profile secrets.';
