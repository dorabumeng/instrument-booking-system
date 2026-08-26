# Phase 4 security review

1. **Admin routes:** the nested `/admin` server layout redirects non-admin profiles. The CSV route independently calls `getAdminContext`; route layout protection is never assumed for route handlers.
2. **Database authorization:** admin operations use the caller-scoped SSR Supabase client. Existing RLS invokes `private.is_admin()`; no service-role client is present.
3. **Role escalation:** normal profile updates remain constrained by RLS and `private.protect_profile_privileges`. Role mutation is a confirmed server action, but the database remains authoritative.
4. **Final administrator:** `private.protect_final_admin` rejects demotion of the last admin with `LAST_ADMIN`, including direct Data API attempts. Self-demotion also requires explicit UI confirmation.
5. **Audit protection:** authenticated clients receive SELECT only, and only the admin SELECT policy passes. INSERT/UPDATE/DELETE grants are absent. SECURITY DEFINER triggers append records with a pinned empty search path.
6. **Booking ownership/history:** normal ownership policies are unchanged. Phase 4 revokes booking DELETE and makes cancelled/completed rows immutable. Cancellation actor identity is overwritten from `auth.uid()` by a database trigger.
7. **Other-user privacy:** the normal calendar still uses `get_instrument_availability`; admin joins exist only in server-rendered admin pages protected by RLS.
8. **Secrets:** only the public Supabase URL and anon key are used. `SUPABASE_SERVICE_ROLE_KEY` remains optional documentation and is never imported.
9. **Instrument enforcement:** booking writes now require `status = available` and `archived_at is null`. Status/archive changes do not silently cancel confirmed reservations.
10. **Direct API bypass attempts:** normal users still lack instrument mutation, all-booking read, role mutation, and audit read policies. Admin hard-delete grants for instruments and bookings are removed in favor of archival/status history.

Migration contract tests verify the final-admin, append-only audit, immutable-history, and hard-delete protections. Full RLS integration tests should also run against a local Supabase instance before deployment.
