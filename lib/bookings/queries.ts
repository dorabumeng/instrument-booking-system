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
  const [available, upcoming, next, recent] = await Promise.all([
    supabase.from("instruments").select("id", { count: "exact", head: true }).eq("status", "available"),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "confirmed").gte("end_time", now),
    supabase.from("bookings").select("*, instrument:instruments(*)").eq("status", "confirmed").gte("end_time", now).order("start_time").limit(1).maybeSingle(),
    supabase.from("bookings").select("*, instrument:instruments(*)").order("updated_at", { ascending: false }).limit(3),
  ]);
  const error = available.error ?? upcoming.error ?? next.error ?? recent.error;
  if (error) { console.error("Dashboard query failed", { code: error.code }); return { data: null, error: "Dashboard information could not be loaded." }; }
  return { data: { availableInstruments: available.count ?? 0, upcomingCount: upcoming.count ?? 0, nextBooking: next.data, recentBookings: recent.data ?? [] }, error: null };
}
