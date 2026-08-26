# Deployment runbook

Promote staging before production. Migration files are the schema source of truth; avoid dashboard schema edits and record any emergency drift as a new ordered migration.

## Environment matrix

| Environment | Supabase | Application URL | Secrets |
|---|---|---|---|
| Local | Supabase CLI, or staging only when intentional | `http://localhost:3000` | `.env.local`, never committed |
| Staging | Dedicated non-production project | Vercel Preview/staging alias | Vercel Preview + protected GitHub `staging` environment |
| Production | Dedicated production project | Exact production origin | Vercel Production only |

Required values are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `LAB_TIMEZONE`, and `NEXT_PUBLIC_LAB_TIMEZONE`. The timezone values must match. URL and anon key are browser-visible and safe only because RLS is authoritative. A service-role key is not required by the deployed app; `SUPABASE_TEST_SERVICE_ROLE_KEY` is used only by the protected staging integration job for fixture setup/cleanup.

## 1. Create and configure staging

1. Create a dedicated Supabase staging project. Enable email/password Auth and choose the confirmation policy.
2. Set Auth Site URL to the stable staging Vercel alias. Add `http://localhost:3000/auth/callback`, the exact staging callback, and a controlled preview wildcard such as `https://*-YOUR_VERCEL_TEAM.vercel.app/**`. Use only an exact callback in production.
3. Install Docker and the Supabase CLI, then run:

   ```bash
   supabase start
   supabase db reset --local --no-seed
   supabase link --project-ref STAGING_PROJECT_REF
   supabase db push --dry-run
   supabase db push
   supabase migration list
   ```

The reset proves the chain builds an empty database. Verify the four application tables, three enums, check and GiST exclusion constraints, triggers, all RLS policies, availability/admin RPCs, indexes, archival columns, audit log, and final-admin trigger. Run `supabase db reset` without `--no-seed` only for local/staging fictional instruments; never automatically seed production.

## 2. Generate types

```bash
pnpm run types:staging
git diff -- types/database.generated.ts
```

Reconcile generated names with `types/database.ts`, update imports deliberately, and run every check. Do not delete interim types until compilation and tests pass.

## 3. Create test users and administrators

Register `user_a`, `user_b`, `admin_a`, and `admin_b` with controlled staging mailboxes. Promote both admins in SQL Editor as project owner:

```sql
begin;
update public.profiles p set role = 'admin'::public.user_role
from auth.users u
where p.id = u.id and lower(u.email) in (lower('admin_a@example.edu'), lower('admin_b@example.edu'));
select id, email, role from public.profiles
where lower(email) in (lower('admin_a@example.edu'), lower('admin_b@example.edu'));
commit;
```

Confirm exactly two intended rows before commit. There is no public bootstrap endpoint, and the database prevents demoting the final admin.

## 4. Validate staging

Store `SUPABASE_TEST_URL`, `SUPABASE_TEST_ANON_KEY`, and `SUPABASE_TEST_SERVICE_ROLE_KEY` in a protected GitHub Environment named `staging`, then manually run **Staging integration tests**. The suite provisions unique users, authenticates via the anon client, tests direct Data API RLS attempts, overlap races and adjacency, instrument status enforcement, privacy RPC shape, audit access, admin operations, and final-admin protection. The service key is used only for test fixture lifecycle.

Run `docs/production-smoke-test.md` against deployed staging. Inspect Network responses for the exact availability keys: `booking_id`, `instrument_id`, `start_time`, `end_time`, `status`. No owner ID, profile, sample, purpose, or notes may be present.

Test with a browser timezone different from the laboratory timezone. Verify the visible zone, cross-midnight reservations, and—if the selected zone observes DST—spring-forward invalid wall times and fall-back ambiguity with lab operators. The database stores absolute `timestamptz`; operational days, calendar, and forms use the fixed lab zone.

## 5. Configure Vercel and release

Import the repository into Vercel and retain `vercel.json`. Set URL/key/timezone values separately for Preview and Production. Preview must use staging Supabase; Production must use production Supabase. Never add service-role or integration-test credentials to browser or Vercel client configuration.

Before production, repeat empty-chain validation and `db push --dry-run`. Verify an appropriate backup exists for the selected Supabase plan. Apply production migrations before the dependent app build, deploy, and run the full smoke checklist using a normal user and two admins.

## Rollback and recovery

- Stop when migration, RLS, race, privacy, or final-admin checks fail.
- Prefer a forward corrective migration; never edit an already-applied migration.
- Roll back Vercel only to a build compatible with the current schema.
- For database recovery, follow the selected plan's Supabase backup/restore procedure and rehearse it in another project. Backup availability/retention are plan-dependent.
- Preserve migration and audit/history records; avoid manual production drift.

## Operations

Supabase Auth/project limits are the first login-abuse control. Booking buttons suppress duplicate submissions, PostgreSQL resolves races, availability is capped at 93 days, and export at 366 days/10,000 rows. Add edge/WAF limits only if traffic warrants them. Logs may include safe operation names and database codes, but never passwords, tokens, cookies, or private booking content. Optional monitoring can later be attached to server actions and route handlers without changing safe user errors.
