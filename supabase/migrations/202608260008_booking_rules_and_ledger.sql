-- Instrument booking rules and university usage-ledger metadata.
create type public.billing_status as enum ('pending', 'charged', 'exempt', 'not_applicable');
create type public.contract_status as enum ('signed', 'not_signed', 'not_required');
create type public.evaluation_status as enum ('submitted', 'not_submitted', 'not_required');
create type public.survey_status as enum ('completed', 'not_completed', 'not_required');

alter table public.instruments
  add column asset_number text,
  add column booking_slot_minutes integer not null default 30,
  add column min_booking_minutes integer not null default 30,
  add column max_booking_minutes integer,
  add constraint instrument_asset_number_length check (asset_number is null or char_length(asset_number) <= 120),
  add constraint instrument_booking_slot_valid check (booking_slot_minutes between 1 and 1440 and 1440 % booking_slot_minutes = 0),
  add constraint instrument_min_booking_valid check (min_booking_minutes between 1 and 43200 and min_booking_minutes % booking_slot_minutes = 0),
  add constraint instrument_max_booking_valid check (max_booking_minutes is null or (max_booking_minutes between min_booking_minutes and 43200 and max_booking_minutes % booking_slot_minutes = 0));

create table public.booking_ledger_details (
  booking_id uuid primary key references public.bookings(id) on delete restrict,
  sample_count integer not null default 1 check (sample_count >= 0 and sample_count <= 1000000),
  statistical_hours numeric(12, 3) check (statistical_hours is null or statistical_hours >= 0),
  payer_name text check (payer_name is null or char_length(payer_name) <= 200),
  payer_organization text check (payer_organization is null or char_length(payer_organization) <= 300),
  billing_status public.billing_status not null default 'pending',
  contract_status public.contract_status not null default 'not_required',
  contract_amount numeric(14, 2) check (contract_amount is null or contract_amount >= 0),
  evaluation_status public.evaluation_status not null default 'not_required',
  survey_status public.survey_status not null default 'not_required',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

alter table public.booking_ledger_details enable row level security;
revoke all on table public.booking_ledger_details from anon, authenticated;
grant select, insert, update on table public.booking_ledger_details to authenticated;
create policy booking_ledger_select_admin on public.booking_ledger_details for select to authenticated using ((select private.is_admin()));
create policy booking_ledger_insert_admin on public.booking_ledger_details for insert to authenticated with check ((select private.is_admin()));
create policy booking_ledger_update_admin on public.booking_ledger_details for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

grant select, insert, update on table public.booking_ledger_details to service_role;

create or replace function private.lab_timezone()
returns text language sql immutable security definer set search_path = ''
as $$ select 'Asia/Shanghai'::text $$;
revoke all on function private.lab_timezone() from public, anon, authenticated, service_role;
comment on function private.lab_timezone() is 'Authoritative database timezone for local slot alignment. Change only through a reviewed migration and keep application LAB_TIMEZONE synchronized.';

create or replace function private.enforce_instrument_booking_rules()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  rules record;
  duration_minutes numeric;
  local_start timestamp;
  local_end timestamp;
  start_minute numeric;
  end_minute numeric;
begin
  if new.status <> 'confirmed'::public.booking_status then return new; end if;
  select booking_slot_minutes, min_booking_minutes, max_booking_minutes
    into rules from public.instruments where id = new.instrument_id;
  if not found then return new; end if;
  duration_minutes := extract(epoch from (new.end_time - new.start_time)) / 60;
  if duration_minutes < rules.min_booking_minutes then
    raise exception using errcode = '23514', message = 'BOOKING_BELOW_MINIMUM';
  end if;
  if rules.max_booking_minutes is not null and duration_minutes > rules.max_booking_minutes then
    raise exception using errcode = '23514', message = 'BOOKING_ABOVE_MAXIMUM';
  end if;
  local_start := new.start_time at time zone private.lab_timezone();
  local_end := new.end_time at time zone private.lab_timezone();
  start_minute := extract(epoch from (local_start - date_trunc('day', local_start))) / 60;
  end_minute := extract(epoch from (local_end - date_trunc('day', local_end))) / 60;
  if mod(start_minute, rules.booking_slot_minutes) <> 0 or mod(end_minute, rules.booking_slot_minutes) <> 0 then
    raise exception using errcode = '23514', message = 'BOOKING_SLOT_MISALIGNED';
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_instrument_booking_rules() from public, anon, authenticated, service_role;
create trigger bookings_15_enforce_instrument_rules before insert or update of instrument_id, start_time, end_time, status on public.bookings
for each row execute function private.enforce_instrument_booking_rules();

create or replace function private.set_ledger_metadata()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end;
$$;
revoke all on function private.set_ledger_metadata() from public, anon, authenticated, service_role;
create trigger booking_ledger_set_metadata before insert or update on public.booking_ledger_details
for each row execute function private.set_ledger_metadata();

create index booking_ledger_billing_idx on public.booking_ledger_details(billing_status);
comment on table public.booking_ledger_details is 'One-to-one administrative university usage-ledger metadata. No authenticated DELETE grant; booking history is retained.';
