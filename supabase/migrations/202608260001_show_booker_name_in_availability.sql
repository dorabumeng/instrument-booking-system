-- Calendar viewers may see who reserved an occupied slot, but no other booking
-- or profile details are exposed.
drop function if exists public.get_instrument_availability(uuid, timestamptz, timestamptz);

create function public.get_instrument_availability(
  requested_instrument_id uuid,
  range_start timestamptz,
  range_end timestamptz
)
returns table (
  booking_id uuid,
  instrument_id uuid,
  start_time timestamptz,
  end_time timestamptz,
  status public.booking_status,
  reserver_name text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if range_end <= range_start or range_end - range_start > interval '93 days' then
    raise exception using errcode = '22023', message = 'Invalid availability range';
  end if;

  return query
    select b.id, b.instrument_id, b.start_time, b.end_time, b.status, p.full_name
    from public.bookings b
    join public.profiles p on p.id = b.user_id
    where b.instrument_id = requested_instrument_id
      and b.status = 'confirmed'::public.booking_status
      and b.start_time < range_end
      and b.end_time > range_start
    order by b.start_time;
end;
$$;

revoke all on function public.get_instrument_availability(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.get_instrument_availability(uuid, timestamptz, timestamptz) to authenticated;
comment on function public.get_instrument_availability(uuid, timestamptz, timestamptz) is
  'Authenticated calendar viewers receive occupied ranges and the reserver full name; email, user ID, sample, purpose, and notes remain private.';
