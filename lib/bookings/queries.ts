import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BookingWithInstrument } from "@/types/booking";
import type { QueryResult } from "@/lib/instruments/queries";

export async function getMyBookings(limit?: number): Promise<QueryResult<BookingWithInstrument[]>> {
  const supabase = await createClient();
  let query = supabase.from("bookings").select("*, instrument:instruments(*)").order("start_time", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) { console.error("Booking query failed", { code: error.code }); return { data: null, error: "Bookings could not be loaded." }; }
  return { data, error: null };
}

export type DashboardSummary = { availableInstruments: number; upcomingCount: number; nextBooking: BookingWithInstrument | null; recentBookings: BookingWithInstrument[] };
export async function getDashboardSummary(): Promise<QueryResult<DashboardSummary>> {
  const supabase = await createClient(); const now = new Date().toISOString();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { data: null, error: "Your session has expired. Please sign in again." };

  const [available, upcoming, next, recent] = await Promise.all([
    supabase.from("instruments").select("id", { count: "exact", head: true }).eq("status", "available"),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "confirmed").gte("end_time", now),
    supabase.from("bookings").select("*, instrument:instruments(*)").eq("user_id", user.id).eq("status", "confirmed").gte("end_time", now).order("start_time").limit(1).maybeSingle(),
    supabase.from("bookings").select("*, instrument:instruments(*)").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(3),
  ]);
  const failed = [
    { query: "availableInstruments", error: available.error },
    { query: "upcomingBookings", error: upcoming.error },
    { query: "nextBooking", error: next.error },
    { query: "recentBookings", error: recent.error },
  ].find((entry) => entry.error);
  if (failed) {
    const { query, error } = failed;
    console.error("Dashboard query failed", {
      query,
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });
    return { data: null, error: "Dashboard information could not be loaded." };
  }
  return { data: { availableInstruments: available.count ?? 0, upcomingCount: upcoming.count ?? 0, nextBooking: next.data, recentBookings: recent.data ?? [] }, error: null };
}
