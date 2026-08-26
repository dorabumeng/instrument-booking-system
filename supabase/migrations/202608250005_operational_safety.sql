-- Phase 4 operational columns and database-enforced safety invariants.
alter table public.instruments
  add column archived_at timestamptz,
  add constraint instrument_name_length check (char_length(trim(name)) between 2 and 120),
  add constraint instrument_location_length check (char_length(trim(location)) between 2 and 200),
  add constraint instrument_manager_length check (char_length(trim(manager)) between 2 and 200),
  add constraint instrument_description_length check (char_length(description) <= 5000),
  add constraint instrument_image_url_length check (image_url is null or char_length(image_url) <= 2048);

alter table public.bookings
  add column cancelled_at timestamptz,
  add column cancelled_by uuid references public.profiles(id) on delete set null,
  add column cancellation_reason text,
  add constraint booking_cancellation_reason_length check (cancellation_reason is null or char_length(cancellation_reason) <= 1000);

-- Phase 4 uses archival and status cancellation exclusively. Remove Data API hard-delete paths.
revoke delete on table public.instruments, public.bookings from authenticated;
drop policy if exists instruments_delete_admin on public.instruments;
drop policy if exists bookings_delete_admin on public.bookings;

create or replace function private.protect_final_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'admin'::public.user_role and new.role <> 'admin'::public.user_role
     and not exists (
       select 1 from public.profiles
       where role = 'admin'::public.user_role and id <> old.id
     ) then
    raise exception using errcode = 'P0001', message = 'LAST_ADMIN';
  end if;
  return new;
end;
$$;

revoke all on function private.protect_final_admin() from public, anon, authenticated;
create trigger profiles_20_protect_final_admin before update of role on public.profiles
for each row execute function private.protect_final_admin();

create or replace function private.set_cancellation_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status <> 'cancelled'::public.booking_status and new.status = 'cancelled'::public.booking_status then
    new.cancelled_at = now();
    new.cancelled_by = (select auth.uid());
  elsif old.status = 'cancelled'::public.booking_status then
    new.cancelled_at = old.cancelled_at;
    new.cancelled_by = old.cancelled_by;
    new.cancellation_reason = old.cancellation_reason;
  elsif new.status <> 'cancelled'::public.booking_status then
    new.cancelled_at = null;
    new.cancelled_by = null;
    new.cancellation_reason = null;
  end if;
  return new;
end;
$$;

revoke all on function private.set_cancellation_metadata() from public, anon, authenticated;
create trigger bookings_20_set_cancellation_metadata before update on public.bookings
for each row execute function private.set_cancellation_metadata();

-- Replace the Phase 2 function so archived instruments are also unbookable.
create or replace function private.enforce_booking_write_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare caller uuid := (select auth.uid());
begin
  if tg_op = 'UPDATE' and old.status in ('cancelled'::public.booking_status, 'completed'::public.booking_status) then
    raise exception using errcode = '42501', message = 'Historical bookings are immutable';
  end if;
  if caller is not null and not (select private.is_admin()) then
    if tg_op = 'INSERT' then
      if new.user_id <> caller or new.status <> 'confirmed'::public.booking_status then
        raise exception using errcode = '42501', message = 'Invalid booking owner or status';
      end if;
    elsif new.user_id is distinct from old.user_id
       or old.user_id <> caller
       or old.status <> 'confirmed'::public.booking_status
       or old.start_time <= now()
       or new.start_time <= now()
       or new.status not in ('confirmed'::public.booking_status, 'cancelled'::public.booking_status) then
      raise exception using errcode = '42501', message = 'Booking change is not permitted';
    end if;
  end if;
  if new.status = 'confirmed'::public.booking_status and not exists (
    select 1 from public.instruments
    where id = new.instrument_id
      and status = 'available'::public.instrument_status
      and archived_at is null
  ) then
    raise exception using errcode = '23514', message = 'Instrument is not available';
  end if;
  return new;
end;
$$;

comment on column public.instruments.archived_at is 'Soft archive marker. Historical booking foreign keys remain valid.';
comment on function private.protect_final_admin() is 'Prevents every path, including direct Data API updates, from demoting the final administrator.';
