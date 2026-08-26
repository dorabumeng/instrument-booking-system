-- Server validation improves UX; these constraints remain authoritative for all clients.
alter table public.bookings
  add constraint booking_sample_name_length check (char_length(trim(sample_name)) between 2 and 120),
  add constraint booking_purpose_length check (char_length(trim(purpose)) between 3 and 1000),
  add constraint booking_notes_length check (notes is null or char_length(notes) <= 4000);
