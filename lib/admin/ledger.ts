import "server-only";
import { DateTime } from "luxon";
import { getAdminContext } from "./auth";
import type { AdminBooking } from "@/types/booking";

export async function getLedgerBookings({ from, to, instrument, user, status, zone }: { from: string; to: string; instrument?: string; user?: string; status?: string; zone: string }) {
  const context = await getAdminContext();
  if (!context) return { data: null, error: "FORBIDDEN" };
  const start = DateTime.fromISO(from, { zone }).startOf("day");
  const end = DateTime.fromISO(to, { zone }).plus({ days: 1 }).startOf("day");
  if (!start.isValid || !end.isValid || end <= start || end.diff(start, "days").days > 1096) return { data: null, error: "INVALID_RANGE" };
  let query = context.supabase.from("bookings").select("*, instrument:instruments(*), user:profiles!bookings_user_id_fkey(*), ledger:booking_ledger_details(*)").gte("start_time", start.toUTC().toISO()!).lt("start_time", end.toUTC().toISO()!).order("start_time").limit(10000);
  if (instrument) query = query.eq("instrument_id", instrument);
  if (user) query = query.eq("user_id", user);
  if (status && ["confirmed", "cancelled", "completed"].includes(status)) query = query.eq("status", status as "confirmed" | "cancelled" | "completed");
  const result = await query;
  if (result.error) { console.error("Ledger export query failed", { code: result.error.code }); return { data: null, error: "DATABASE_ERROR" }; }
  return { data: result.data as AdminBooking[], error: null };
}
