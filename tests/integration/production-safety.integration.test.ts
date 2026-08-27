import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.ts";

const enabled = process.env.RUN_PRODUCTION_SAFETY_INTEGRATION === "true";
const integration = enabled ? test : test.skip;
const password = "Disposable-only-Password-42!";
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Production-safety integration environment is missing ${name}.`);
  return value;
}

integration("profile deletion preserves history and protects the final administrator", async (context) => {
  const service = createClient<Database>(required("SUPABASE_TEST_URL"), required("SUPABASE_TEST_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const existingAdmins = await service.from("profiles").select("id").eq("role", "admin");
  assert.ifError(existingAdmins.error);
  if (existingAdmins.data.length > 0) {
    context.skip("Production-safety deletion tests require a freshly reset, isolated test database.");
    return;
  }

  async function createAccount(label: string) {
    const result = await service.auth.admin.createUser({
      email: `${label}-${suffix}@example.invalid`,
      password,
      email_confirm: true,
      user_metadata: { full_name: label },
    });
    assert.ifError(result.error);
    return result.data.user.id;
  }

  const historyUserId = await createAccount("history-user");
  const emptyUserId = await createAccount("empty-user");
  const adminAId = await createAccount("admin-a");
  const adminBId = await createAccount("admin-b");
  let instrumentId = "";
  let bookingId = "";

  const promoted = await service.from("profiles").update({ role: "admin" }).in("id", [adminAId, adminBId]);
  assert.ifError(promoted.error);

  try {
    const instrument = await service.from("instruments").insert({
      name: `History fixture ${suffix}`,
      description: "Disposable production-safety fixture",
      location: "Isolated test database",
      manager: "Integration suite",
      status: "available",
    }).select("id").single();
    assert.ifError(instrument.error);
    instrumentId = instrument.data.id;

    const booking = await service.from("bookings").insert({
      instrument_id: instrumentId,
      user_id: historyUserId,
      start_time: "2038-01-01T01:00:00Z",
      end_time: "2038-01-01T02:00:00Z",
      sample_name: "History fixture",
      purpose: "Deletion protection integration test",
    }).select("id").single();
    assert.ifError(booking.error);
    bookingId = booking.data.id;

    const deleteHistoryUser = await service.auth.admin.deleteUser(historyUserId);
    assert.ok(deleteHistoryUser.error, "Auth deletion must fail while booking history references the profile");
    const preservedBooking = await service.from("bookings").select("id,user_id").eq("id", bookingId).single();
    assert.ifError(preservedBooking.error);
    assert.equal(preservedBooking.data.user_id, historyUserId);
    const preservedProfile = await service.from("profiles").select("id").eq("id", historyUserId).single();
    assert.ifError(preservedProfile.error);

    const deleteEmptyUser = await service.auth.admin.deleteUser(emptyUserId);
    assert.ifError(deleteEmptyUser.error);
    const emptyProfile = await service.from("profiles").select("id").eq("id", emptyUserId);
    assert.ifError(emptyProfile.error);
    assert.equal(emptyProfile.data.length, 0);

    const demoteB = await service.from("profiles").update({ role: "user" }).eq("id", adminBId);
    assert.ifError(demoteB.error);
    const demoteFinal = await service.from("profiles").update({ role: "user" }).eq("id", adminAId);
    assert.match(demoteFinal.error?.message ?? "", /LAST_ADMIN/);
    const restoreB = await service.from("profiles").update({ role: "admin" }).eq("id", adminBId);
    assert.ifError(restoreB.error);

    const deleteNonFinalAdmin = await service.auth.admin.deleteUser(adminBId);
    assert.ifError(deleteNonFinalAdmin.error);
    const deletedAdminProfile = await service.from("profiles").select("id").eq("id", adminBId);
    assert.ifError(deletedAdminProfile.error);
    assert.equal(deletedAdminProfile.data.length, 0);

    const deleteFinalAdmin = await service.auth.admin.deleteUser(adminAId);
    assert.ok(deleteFinalAdmin.error, "Deleting the final administrator must fail");
    const finalAdmin = await service.from("profiles").select("id,role").eq("id", adminAId).single();
    assert.ifError(finalAdmin.error);
    assert.equal(finalAdmin.data.role, "admin");
  } finally {
    if (bookingId) await service.from("bookings").delete().eq("id", bookingId);
    if (instrumentId) await service.from("instruments").delete().eq("id", instrumentId);
    await service.auth.admin.deleteUser(historyUserId);
    // The database correctly prevents deleting the remaining final admin. This
    // one-shot suite therefore runs only on a disposable database that is reset afterward.
  }
});
