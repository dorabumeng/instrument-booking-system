# CoreLab Scheduler

A production-oriented university laboratory instrument booking system built with Next.js 15, TypeScript, the App Router, Tailwind CSS, FullCalendar, PostgreSQL, and Supabase. Phase 3 provides live normal-user instrument discovery, availability calendars, and booking management on top of the Phase 2 authentication and RLS foundation.

## Local setup

Requirements: Node.js 20.9 or later, npm, and a Supabase project.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Available checks are `npm run typecheck`, `npm run lint`, and `npm run build`.

## Supabase Setup

### 1. Create a project

Create a project at [Supabase](https://supabase.com/dashboard), choose a strong database password, and wait for provisioning to finish. In Authentication settings, enable Email authentication. Decide whether email confirmation is required; both confirmed and immediate-session signup flows are supported.

Add these redirect URLs under Authentication → URL Configuration:

- `http://localhost:3000/auth/callback`
- Your eventual production origin followed by `/auth/callback`

### 2. Configure environment variables

Copy the project URL and legacy anon/public key from Project Settings → API into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These values identify the project but do not bypass RLS. A future trusted backend job may use `SUPABASE_SERVICE_ROLE_KEY`; it is optional in Phase 2, must remain server-only, and must never be prefixed with `NEXT_PUBLIC_`.

### 3. Apply migrations

Install and authenticate the Supabase CLI, then link the local directory to the remote project and apply the ordered files in `supabase/migrations`:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

For local Supabase development, use `npx supabase start` followed by `npx supabase db reset`. The old `supabase/schema.sql` is retained only as an archived Phase 1 design note and must not be applied.

### 4. Authentication and sessions

Email/password signup sends `full_name` as Auth user metadata. Server actions handle signup, sign-in, sign-out, validation, and friendly errors. `@supabase/ssr` stores sessions in cookies. Middleware refreshes expired tokens and performs early route redirects; protected layouts also verify the user server-side. The browser client and server client are separate, and no service-role client is shipped.

If email confirmation is enabled, Supabase redirects through `/auth/callback`, which exchanges the PKCE code for the cookie-backed session.

### 5. Automatic profiles

The `on_auth_user_created` database trigger runs after an Auth user is inserted. Its pinned-search-path function creates a one-to-one `public.profiles` row using the authenticated email and `full_name` metadata. It uses an idempotent upsert for practical recovery without overwriting an existing role.

Users may edit only their own display name, research group, and phone through `/profile`. Email and role changes are protected by both RLS and a database trigger.

### 6. Create the first administrator

First register normally, then use the Supabase SQL Editor while signed in as the project owner. Identify the exact Auth user by email and promote only that row:

```sql
begin;

update public.profiles p
set role = 'admin'::public.user_role
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('lab-admin@university.edu');

-- Must return exactly the intended account before committing.
select p.id, p.email, p.role
from public.profiles p
where lower(p.email) = lower('lab-admin@university.edu');

commit;
```

If the verification is wrong, run `rollback` instead of `commit`. There is intentionally no public “become admin” endpoint. Subsequent role management must be performed through a trusted admin-only server/database path.

### 7. RLS security model

RLS is enabled on every public application table. Grants and policies work together:

- Profiles: users select/update their own row; admins select/update all. A trigger rejects non-admin attempts to change role, email, ID, or creation time.
- Instruments: authenticated members read; only admins insert, update, or delete.
- Bookings: members read their own complete rows, insert only with `user_id = auth.uid()`, and update only their own future confirmed rows. Members cannot delete rows; cancellation is a status update. Admins can read and manage all rows.
- `private.is_admin()` is a `SECURITY DEFINER` helper that avoids recursive profile-policy evaluation. Its search path is empty, all objects are schema-qualified, execution is restricted, and the `private` schema is not exposed by the Data API.
- Booking triggers provide defense in depth for protected ownership/status transitions and prevent confirmed reservations for unavailable instruments.

The authoritative overlap rule is the PostgreSQL GiST exclusion constraint on `instrument_id` and `tstzrange(start_time, end_time, '[)')`, filtered to confirmed rows. Half-open ranges allow `09:00–10:00` beside `10:00–11:00`, while PostgreSQL atomically rejects true overlaps even under simultaneous requests.

### 8. Privacy-safe calendar availability

Direct `bookings` queries return complete rows only to the owner or an administrator. Other members obtain occupied ranges through `get_instrument_availability(instrument_id, range_start, range_end)`. This tightly scoped `SECURITY DEFINER` RPC verifies authentication, limits requests to 93 days, and returns only booking ID, instrument ID, start/end time, and confirmed status. It never selects or transmits user ID, sample name, purpose, notes, email, phone, or other profile data.

## Architecture

- `app/(portal)`: authenticated pages sharing a server-protected layout
- `app/auth/callback`: email-confirmation/PKCE callback
- `components/AuthForm.tsx`: login/registration state and user-safe errors
- `lib/supabase`: typed browser, server, environment, and middleware clients
- `lib/auth`: server actions and cached server-side identity/profile helpers
- `types/database.ts`: interim hand-maintained Supabase types
- `supabase/migrations`: ordered executable database migrations

Regenerate database types after applying migrations and replace the interim file:

```bash
npx supabase gen types typescript --linked > types/database.generated.ts
```

Review the generated import transition before deleting `types/database.ts`.

## Booking workflow

Instrument lists, details, dashboard summaries, and personal booking history are read from Supabase. The instrument calendar uses FullCalendar with month, week, and day views. Each visible range calls `get_instrument_availability`; the browser separately requests the current user’s own complete bookings under RLS and merges them by ID. This displays private details only for the owner and generic “Occupied” events for everyone else.

Create, edit, and cancel operations are server actions. They revalidate identity, normalize browser-local inputs to ISO timestamps, check instrument state, apply shared length/time validation, and let PostgreSQL/RLS make the authoritative decision. PostgreSQL error codes are centrally translated into safe application messages. Normal users cancel by setting `status = 'cancelled'`; records are never deleted.

### Timezone behavior

FullCalendar uses its Luxon named-timezone adapter. Form wall times, calendar display, admin operational days, and export date filters use the configured fixed laboratory IANA timezone; PostgreSQL stores absolute `timestamptz` instants. Set matching `LAB_TIMEZONE` and `NEXT_PUBLIC_LAB_TIMEZONE` values before accepting reservations.

### Phase 3 migration

`202608250004_booking_content_constraints.sql` adds database checks for sample, purpose, and notes lengths. Apply it with the other migrations using `npx supabase db push`.

## Administration

Every `/admin` page is protected by a nested server layout and by RLS. Administrator queries use the authenticated caller’s SSR client—never the service-role key.

- `/admin` uses efficient database counts for instruments, users, upcoming bookings, and today’s bookings.
- `/admin/instruments` creates and edits equipment, changes status with future-reservation warnings, and archives instruments.
- `/admin/bookings` provides server pagination and filters, booking inspection/editing, reasoned cancellation, durations, and date-range CSV export.
- `/admin/users` provides paginated name/email/group search and confirmed role changes.
- `/admin/audit` provides paginated action/actor/date filtering and readable metadata details.

### Instrument management and archival

Phase 4 uses soft archival. Archiving sets `archived_at` and changes status to `unavailable`; it never deletes the row or its bookings. Archived instruments disappear from normal discovery and cannot receive new confirmed bookings, but historical booking joins remain valid. Instrument and booking DELETE grants are removed from the authenticated Data API.

Changing an instrument to maintenance or unavailable shows the number of future confirmed reservations and requires confirmation. Those reservations remain unchanged for an administrator to review individually.

### Booking administration and cancellation

Administrative cancellation requires a reason and sets `status = cancelled`. A trigger derives `cancelled_by` from `auth.uid()` and records `cancelled_at`; client-supplied actor identity is not trusted. User cancellation uses the same actor trigger. Cancelled and completed bookings are immutable, and no UI or Data API hard-delete path remains.

The CSV export requires an administrator session, applies RLS, accepts a maximum 366-day range, caps output at 10,000 rows, and sends a private, non-cacheable response.

### Role management and final-admin protection

Role changes require an authenticated administrator and explicit confirmation. `private.protect_final_admin()` rejects any attempt to demote the final administrator, including a direct API request. Self-demotion warns that admin access will end immediately when another admin exists.

The first administrator procedure earlier in this README remains the bootstrap path. There is no public promotion endpoint.

### Audit log

`audit_logs` is append-only from the application perspective. Database triggers record instrument creation/update/status/archive actions, booking creation/update/cancellation, administrative cancellation, and role changes. Actors come from the authenticated database context. Normal users have no audit grants or policies; administrators receive read-only access.

### Phase 4 migrations

- `202608250005_operational_safety.sql`: archival, cancellation metadata, final-admin protection, immutable history, validation, and removal of hard-delete grants.
- `202608250006_audit_and_admin_indexes.sql`: append-only audit log, protected audit triggers, admin aggregate RPC, RLS, and targeted booking/audit indexes.

Apply all pending changes with `npx supabase db push`. Review `docs/phase4-security-review.md` before production rollout.

## Recommended deployment workflow

1. Create a staging Supabase project and run all migrations.
2. Bootstrap and verify at least two administrator accounts.
3. Run unit tests and local pgTAP/RLS integration tests with separate normal/admin users.
4. Exercise status warnings, archival, role changes, admin cancellation, audit entries, and CSV export in staging.
5. Configure only the public Supabase URL and anon key in the hosting environment. Add a service-role secret only if a future trusted backend job explicitly requires it.
6. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` in CI.
7. Apply production migrations before releasing the corresponding application build, then perform a short administrator smoke test.

## Remaining phases

1. **Automation:** optional trusted scheduler for moving ended confirmed bookings to `completed`. Until then, confirmed bookings with ended timestamps are classified as Past for display only.
2. **Production readiness:** pgTAP RLS integration tests, browser/accessibility QA, rate limiting, observability, CI, backup/restore verification, and Vercel deployment.

## Data requirements

The application no longer contains mock instruments or bookings. An administrator must seed or insert at least one instrument through trusted SQL until the administration UI is built. The application shows intentional empty states when no records exist.

## Phase 5 deployment readiness

Deployment is staging-first. See [`docs/deployment-runbook.md`](docs/deployment-runbook.md), [`docs/production-smoke-test.md`](docs/production-smoke-test.md), and [`docs/phase5-security-review.md`](docs/phase5-security-review.md). CI uses pnpm with a frozen lockfile: ordinary PRs run typecheck, lint, unit tests, and build without staging secrets; migration inputs trigger an empty local Supabase replay; protected staging integration tests are manual.

The fixed laboratory timezone is configured with matching `LAB_TIMEZONE` and `NEXT_PUBLIC_LAB_TIMEZONE` IANA values. PostgreSQL stores absolute `timestamptz`; operational “Today”, export date boundaries, FullCalendar, and booking form wall times use that fixed zone. The UI labels the calendar zone. CSV timestamps are ISO UTC, and formula-like cells are neutralized before CSV quoting.

```bash
supabase db reset --local --no-seed
supabase db push --dry-run
supabase db push
pnpm run types:staging
RUN_SUPABASE_INTEGRATION=true pnpm run test:integration
```

The interim `types/database.ts` remains until types are generated from a linked staging database and reconciled. Never commit `.env.local`, service-role keys, staging test credentials, or database passwords.
