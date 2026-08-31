-- Capture the required sample quantity at booking time so exports are complete.
alter table public.bookings
  add column sample_count integer not null default 1,
  add constraint bookings_sample_count_valid check (sample_count between 1 and 1000000);

update public.bookings as booking
set sample_count = ledger.sample_count
from public.booking_ledger_details as ledger
where ledger.booking_id = booking.id and ledger.sample_count between 1 and 1000000;

comment on column public.bookings.sample_count is 'Required sample quantity supplied by the user when making the booking.';
