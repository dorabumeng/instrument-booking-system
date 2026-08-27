# Phase 5 security review

- **Routes:** middleware redirects unauthenticated users; portal/admin layouts repeat server identity and role checks.
- **Authorization:** app mutations use authenticated SSR clients and RLS. No service role is shipped.
- **Roles:** profile triggers reject user escalation; admin RLS gates management; database logic rejects final-admin demotion.
- **Bookings/privacy:** ownership derives from `auth.uid()`. Full rows are owner/admin-only. Availability returns booking ID, instrument ID, start/end, status, and reserver name only.
- **Audit:** triggers derive actors from `auth.uid()`. Clients cannot insert/update/delete logs; admins have select-only RLS.
- **Instruments:** a trigger blocks confirmed bookings for maintenance, unavailable, or archived instruments; history remains.
- **Concurrency:** partial GiST exclusion is authoritative; half-open ranges permit adjacency.
- **CSV:** admin/RLS gate, UTC ISO timestamps, 366-day range, strict 10,000-row rejection, CSV quoting, and formula neutralization are server-side.
- **Headers:** CSP, `nosniff`, strict referrer policy, frame denial, and restrictive permissions policy are enabled. Inline/eval allowances remain for Next.js/FullCalendar compatibility; validate staging and consider nonces later.
- **Secrets/tests:** `.env*` is ignored except the example. Staging secrets are unavailable to pull-request CI. Integration tests call Data APIs directly without weakening RLS.

Staging migration application, generated-type reconciliation, browser/network inspection, Auth redirects, backup verification, and remote integration results must not be claimed until an operator links credentials and runs the documented process.
