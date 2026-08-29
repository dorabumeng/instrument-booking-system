import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.ts";

const enabled = process.env.RUN_SUPABASE_INTEGRATION === "true";
const integration = enabled ? test : test.skip;
type Client = SupabaseClient<Database>;
let service: Client; let userA: Client; let userB: Client; let adminA: Client;
let userAId = ""; let userBId = ""; let adminAId = ""; let adminBId = ""; let instrumentId = "";
const password = "Staging-only-Password-42!";
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function required(name: string) { const value = process.env[name]; if (!value) throw new Error(`Integration test environment is missing ${name}.`); return value; }
async function authClient(email: string) { const client = createClient<Database>(required("SUPABASE_TEST_URL"), required("SUPABASE_TEST_ANON_KEY"), { auth: { persistSession: false } }); const result = await client.auth.signInWithPassword({ email, password }); assert.ifError(result.error); return client; }
async function createAccount(label: string) { const email = `${label}-${suffix}@example.invalid`; const result = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: label } }); assert.ifError(result.error); return { id: result.data.user.id, email }; }

before(async () => {
  if (!enabled) return;
  service = createClient<Database>(required("SUPABASE_TEST_URL"), required("SUPABASE_TEST_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
  const [a, b, aa, ab] = await Promise.all([createAccount("user-a"), createAccount("user-b"), createAccount("admin-a"), createAccount("admin-b")]);
  userAId = a.id; userBId = b.id; adminAId = aa.id; adminBId = ab.id;
  const promoted = await service.from("profiles").update({ role: "admin" }).in("id", [adminAId, adminBId]); assert.ifError(promoted.error);
  [userA, userB, adminA] = await Promise.all([authClient(a.email), authClient(b.email), authClient(aa.email)]);
  const instrument = await adminA.from("instruments").insert({ name: `RLS fixture ${suffix}`, description: "Staging integration fixture", location: "Staging test lab", manager: "Integration suite", status: "available" }).select("id").single(); assert.ifError(instrument.error); instrumentId = instrument.data.id;
});

after(async () => {
  if (!enabled || !service) return;
  if (instrumentId) await service.from("bookings").delete().eq("instrument_id", instrumentId);
  if (instrumentId) await service.from("instruments").delete().eq("id", instrumentId);
  for (const id of [userAId, userBId, adminAId, adminBId]) if (id) await service.auth.admin.deleteUser(id);
});

integration("normal-user RLS, privacy RPC, and concurrent overlap enforcement", async () => {
  const ownProfile = await userA.from("profiles").select("id,full_name,email,group_name,phone,role").eq("id", userAId).single(); assert.ifError(ownProfile.error);
  const protectedUpdate = await userA.from("profiles").update({ role: "admin" }).eq("id", userAId).select("role"); assert.ok(protectedUpdate.error || protectedUpdate.data.length === 0 || protectedUpdate.data[0]?.role !== "admin");
  const forbiddenInstrument = await userA.from("instruments").insert({ name: "Forbidden instrument", description: "Must fail", location: "Nowhere", manager: "Nobody" }); assert.ok(forbiddenInstrument.error);
  const start = "2035-06-01T01:00:00Z"; const end = "2035-06-01T03:00:00Z";
  const attempts = await Promise.all([userA, userB].map((client, index) => client.from("bookings").insert({ instrument_id: instrumentId, user_id: index ? userBId : userAId, start_time: start, end_time: end, sample_name: `sample-${index}`, purpose: "Concurrent integration test" }).select("id").single()));
  assert.equal(attempts.filter(item => !item.error).length, 1); assert.equal(attempts.filter(item => item.error?.code === "23P01").length, 1);
  const otherId = attempts[1].data?.id ?? attempts[0].data!.id; const otherRead = await userA.from("bookings").select("*").eq("id", otherId); if (attempts[1].data) assert.equal(otherRead.data?.length, 0);
  const availability = await userA.rpc("get_instrument_availability", { requested_instrument_id: instrumentId, range_start: "2035-06-01T00:00:00Z", range_end: "2035-06-02T00:00:00Z" }); assert.ifError(availability.error); assert.deepEqual(Object.keys(availability.data![0]).sort(), ["booking_id", "end_time", "instrument_id", "reserver_name", "start_time", "status"]); assert.match(availability.data![0].reserver_name, /^user-[ab]$/);
  const fakeOwner = await userA.from("bookings").insert({ instrument_id: instrumentId, user_id: userBId, start_time: "2035-06-02T01:00:00Z", end_time: "2035-06-02T02:00:00Z", sample_name: "forbidden", purpose: "Must fail" }); assert.ok(fakeOwner.error);
  const auditRead = await userA.from("audit_logs").select("id"); assert.ok(auditRead.error || auditRead.data.length === 0);
  const fakeAudit = await userA.from("audit_logs").insert({ action: "fake", entity_type: "test" }); assert.ok(fakeAudit.error);
});

integration("public signup creates the matching profile through the Auth trigger", async () => {
  const emailDomain = process.env.SUPABASE_TEST_EMAIL_DOMAIN ?? "example.com";
  const email = `public-signup-${suffix}@${emailDomain}`;
  const signupClient = createClient<Database>(required("SUPABASE_TEST_URL"), required("SUPABASE_TEST_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signup = await signupClient.auth.signUp({
    email,
    password,
    options: { data: { full_name: "Public signup test" } },
  });
  assert.ifError(signup.error);
  assert.ok(signup.data.user?.id);

  const userId = signup.data.user!.id;
  try {
    const profile = await service.from("profiles").select("id,email,full_name,role").eq("id", userId).single();
    assert.ifError(profile.error);
    assert.deepEqual(profile.data, { id: userId, email, full_name: "Public signup test", role: "user" });
  } finally {
    await service.auth.admin.deleteUser(userId);
  }
});

integration("back-to-back succeeds, contained overlap fails, status blocks writes, and admin privileges work", async () => {
  const first = await userA.from("bookings").insert({ instrument_id: instrumentId, user_id: userAId, start_time: "2035-07-01T01:00:00Z", end_time: "2035-07-01T02:00:00Z", sample_name: "Sample-A", purpose: "Boundary test" }).select("id").single(); assert.ifError(first.error);
  const adjacent = await userB.from("bookings").insert({ instrument_id: instrumentId, user_id: userBId, start_time: "2035-07-01T02:00:00Z", end_time: "2035-07-01T03:00:00Z", sample_name: "Sample-B", purpose: "Boundary test" }).select("id").single(); assert.ifError(adjacent.error);
  const misaligned = await userB.from("bookings").insert({ instrument_id: instrumentId, user_id: userBId, start_time: "2035-07-01T01:15:00Z", end_time: "2035-07-01T01:45:00Z", sample_name: "Sample-C", purpose: "Slot-alignment test" }); assert.equal(misaligned.error?.code, "23514");
  const contained = await userB.from("bookings").insert({ instrument_id: instrumentId, user_id: userBId, start_time: "2035-07-01T01:30:00Z", end_time: "2035-07-01T02:00:00Z", sample_name: "Sample-D", purpose: "Aligned overlap test" }); assert.equal(contained.error?.code, "23P01");
  const userCancel = await userA.from("bookings").update({ status: "cancelled", cancellation_reason: null }).eq("id", first.data.id).select("status,cancelled_at,cancelled_by").single(); assert.ifError(userCancel.error); assert.equal(userCancel.data.cancelled_by, userAId); assert.ok(userCancel.data.cancelled_at);
  const immutable = await userA
  .from("bookings")
  .update({ sample_name: "changed" })
  .eq("id", first.data.id)
  .select("id,sample_name");

assert.ok(
  immutable.error || immutable.data.length === 0,
  "Cancelled booking must not be mutable"
);

const verifyImmutable = await adminA
  .from("bookings")
  .select("sample_name,status")
  .eq("id", first.data.id)
  .single();

assert.ifError(verifyImmutable.error);
assert.equal(verifyImmutable.data.status, "cancelled");
assert.equal(verifyImmutable.data.sample_name, "Sample-A");
  const adminCancel = await adminA.from("bookings").update({ status: "cancelled", cancellation_reason: "Staging administrative test" }).eq("id", adjacent.data.id).select("status,cancelled_at,cancelled_by,cancellation_reason").single(); assert.ifError(adminCancel.error); assert.equal(adminCancel.data.cancelled_by, adminAId); assert.equal(adminCancel.data.cancellation_reason, "Staging administrative test");
  const maintenance = await adminA.from("instruments").update({ status: "maintenance" }).eq("id", instrumentId); assert.ifError(maintenance.error);
  const blocked = await userA.from("bookings").insert({ instrument_id: instrumentId, user_id: userAId, start_time: "2035-08-01T01:00:00Z", end_time: "2035-08-01T02:00:00Z", sample_name: "blocked", purpose: "Status enforcement" }); assert.ok(blocked.error);
  const existing = await adminA.from("bookings").select("id,user_id").eq("instrument_id", instrumentId); assert.ifError(existing.error); assert.ok(existing.data.length >= 2);
  const logs = await adminA.from("audit_logs").select("action").eq("entity_id", instrumentId); assert.ifError(logs.error); assert.ok(logs.data.some(item => item.action === "instrument_status_changed"));
});

integration("database prevents demotion of the final administrator", async (context) => {
  const administrators = await service.from("profiles").select("id").eq("role", "admin");
  assert.ifError(administrators.error);
  const administratorIds = new Set(administrators.data.map(({ id }) => id));
  const hasOnlyTemporaryAdministrators = administratorIds.size === 2 && administratorIds.has(adminAId) && administratorIds.has(adminBId);

  if (!hasOnlyTemporaryAdministrators) {
    context.skip("Shared staging contains unrelated administrators; LAST_ADMIN requires an isolated test database.");
    return;
  }

  const demoteB = await adminA.from("profiles").update({ role: "user" }).eq("id", adminBId); assert.ifError(demoteB.error);
  try {
    const demoteSelf = await adminA.from("profiles").update({ role: "user" }).eq("id", adminAId); assert.match(demoteSelf.error?.message ?? "", /LAST_ADMIN/);
  } finally {
    const restore = await service.from("profiles").update({ role: "admin" }).in("id", [adminAId, adminBId]); assert.ifError(restore.error);
  }
});
