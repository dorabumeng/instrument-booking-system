-- Core types and tables. Apply with `supabase db push`.
create extension if not exists btree_gist with schema extensions;

create type public.user_role as enum ('user', 'admin');
create type public.instrument_status as enum ('available', 'maintenance', 'unavailable');
create type public.booking_status as enum ('confirmed', 'cancelled', 'completed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  group_name text,
  phone text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_lower_idx on public.profiles (lower(email));

create table public.instruments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  location text not null,
  manager text not null,
  status public.instrument_status not null default 'available',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid not null references public.instruments(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  sample_name text not null,
  purpose text not null,
  notes text,
  status public.booking_status not null default 'confirmed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_time_order check (end_time > start_time),
  constraint no_overlapping_confirmed_bookings exclude using gist (
    instrument_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  ) where (status = 'confirmed')
);

create index bookings_user_start_idx on public.bookings (user_id, start_time);
create index bookings_instrument_start_idx on public.bookings (instrument_id, start_time);
create index bookings_confirmed_range_idx on public.bookings using gist
  (instrument_id, tstzrange(start_time, end_time, '[)')) where (status = 'confirmed');

comment on constraint no_overlapping_confirmed_bookings on public.bookings is
  'Atomic overlap protection. [) permits an end time to equal the next start time.';
