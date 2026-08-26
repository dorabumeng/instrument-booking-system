-- ARCHIVED PHASE 1 DESIGN NOTE — do not apply this file.
-- Executable, ordered migrations now live in supabase/migrations/.
-- The original plan is retained below for design history.
create extension if not exists btree_gist;

create type public.user_role as enum ('user', 'admin');
create type public.instrument_status as enum ('available', 'maintenance', 'unavailable');
create type public.booking_status as enum ('confirmed', 'cancelled', 'completed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  department text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.instruments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  location text not null,
  manager text not null,
  status public.instrument_status not null default 'available',
  image_url text,
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid not null references public.instruments(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  sample_name text not null,
  purpose text not null,
  notes text,
  status public.booking_status not null default 'confirmed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_time_order check (end_time > start_time),
  constraint no_overlapping_active_bookings exclude using gist (
    instrument_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  ) where (status = 'confirmed')
);

create index bookings_user_id_idx on public.bookings(user_id);
create index bookings_instrument_start_idx on public.bookings(instrument_id, start_time);

alter table public.profiles enable row level security;
alter table public.instruments enable row level security;
alter table public.bookings enable row level security;

-- SECURITY PLAN:
-- 1. is_admin() is a security-definer function with a fixed search_path.
-- 2. Authenticated users may read instruments; only admins may mutate them.
-- 3. Users read full details only for their own bookings. A separate safe RPC/view
--    returns occupied ranges without user_id/sample/purpose/notes to other members.
-- 4. Users insert bookings only with user_id = auth.uid(), and update/delete only
--    their own future bookings. Admin policies allow complete management.
-- 5. The exclusion constraint above is authoritative under concurrency; application
--    conflict checks are only for friendly feedback.
