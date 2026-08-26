-- Internal authorization helpers are kept outside the Data API's exposed schema.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'::public.user_role
  );
$$;

revoke all on function private.is_admin() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

comment on function private.is_admin() is
  'SECURITY DEFINER avoids recursive profiles RLS. Empty search_path and qualified names prevent object-shadowing attacks.';

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1), 'Laboratory member'),
    coalesce(new.email, ''),
    'user'::public.user_role
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end,
    updated_at = now();
  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of email on auth.users
for each row execute function private.handle_new_auth_user();

create or replace function private.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Auth/profile maintenance runs without an end-user JWT. RLS separately limits API access.
  if (select auth.uid()) is null or (select private.is_admin()) then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.role is distinct from old.role
     or new.email is distinct from old.email
     or new.created_at is distinct from old.created_at then
    raise exception using errcode = '42501', message = 'Protected profile fields cannot be changed';
  end if;
  return new;
end;
$$;

revoke all on function private.protect_profile_privileges() from public, anon, authenticated;
create trigger profiles_10_protect_privileges before update on public.profiles
for each row execute function private.protect_profile_privileges();
create trigger profiles_90_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger instruments_set_updated_at before update on public.instruments
for each row execute function private.set_updated_at();
create trigger bookings_set_updated_at before update on public.bookings
for each row execute function private.set_updated_at();

create or replace function private.enforce_booking_write_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null or (select private.is_admin()) then return new; end if;
  if tg_op = 'INSERT' then
    if new.user_id <> caller or new.status <> 'confirmed'::public.booking_status then
      raise exception using errcode = '42501', message = 'Invalid booking owner or status';
    end if;
  else
    if new.user_id is distinct from old.user_id
       or old.user_id <> caller
       or old.status <> 'confirmed'::public.booking_status
       or old.start_time <= now()
       or new.start_time <= now()
       or new.status not in ('confirmed'::public.booking_status, 'cancelled'::public.booking_status) then
      raise exception using errcode = '42501', message = 'Booking change is not permitted';
    end if;
  end if;
  if new.status = 'confirmed'::public.booking_status and not exists (
    select 1 from public.instruments where id = new.instrument_id and status = 'available'::public.instrument_status
  ) then
    raise exception using errcode = 'check_violation', message = 'Instrument is not available';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_booking_write_rules() from public, anon, authenticated;
create trigger bookings_10_enforce_write_rules before insert or update on public.bookings
for each row execute function private.enforce_booking_write_rules();
