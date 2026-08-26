-- Staging/local demonstration data only. Never run automatically against production.
insert into public.instruments (id, name, description, location, manager, status)
values
  ('10000000-0000-4000-8000-000000000001', 'PPMS', 'Physical Property Measurement System for temperature and field-dependent measurements.', 'Staging Lab A', 'Staging laboratory manager', 'available'),
  ('10000000-0000-4000-8000-000000000002', 'SQUID', 'Superconducting quantum interference device magnetometer.', 'Staging Lab A', 'Staging laboratory manager', 'available'),
  ('10000000-0000-4000-8000-000000000003', 'XRD', 'X-ray diffractometer for structural characterization.', 'Staging Lab B', 'Staging laboratory manager', 'available'),
  ('10000000-0000-4000-8000-000000000004', 'FMR', 'Ferromagnetic resonance measurement system.', 'Staging Lab B', 'Staging laboratory manager', 'maintenance')
on conflict (id) do nothing;
