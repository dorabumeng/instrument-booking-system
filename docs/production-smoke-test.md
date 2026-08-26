# Production smoke-test checklist

Record tester, environment, deployment ID, laboratory timezone, date, and evidence links.

- [ ] Sign up and complete email confirmation/callback.
- [ ] Log in, refresh a protected route, and verify session persistence.
- [ ] Log out; protected routes redirect to `/login`.
- [ ] View instruments, details, and generic calendar availability.
- [ ] Create, edit, and cancel a future booking; history remains.
- [ ] Concurrent overlaps: one succeeds and one gets a friendly conflict; adjacent slots both succeed.
- [ ] Another user's Network responses contain no private booking/profile fields.
- [ ] Open the admin dashboard, instruments, bookings, users, and audit pages.
- [ ] Set maintenance/unavailable/archive; warning appears, history remains, new booking is blocked.
- [ ] Admin-cancel another user's booking with reason; verify metadata and audit.
- [ ] Promote/demote a test user; verify final-admin rejection.
- [ ] Normal users cannot access admin routes, audit data, or CSV export.
- [ ] CSV filters/range/row caps, ISO UTC timestamps, quoting, and formula neutralization work.
- [ ] Audit records exist for instrument, booking, cancellation, archival, and role actions.
- [ ] Test midnight and, where applicable, DST transitions from another browser timezone.
- [ ] Test mobile/tablet layout and keyboard-only dialogs/forms/tables.
- [ ] Verify CSP/security headers and no required resources are blocked.
