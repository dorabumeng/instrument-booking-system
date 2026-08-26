import "server-only";
import { getAdminContext } from "./auth";
import { getLabTimezone } from "@/lib/config/env";
import { labDayBounds } from "@/lib/timezone";
export type AdminDashboardStats = { totalInstruments: number; availableInstruments: number; maintenanceInstruments: number; totalUsers: number; upcomingBookings: number; todaysBookings: number };
export async function getAdminDashboard() { const context = await getAdminContext(); if (!context) return { data: null, error: "Administrator access is required." }; const now = new Date(); const day = labDayBounds(now, getLabTimezone()); const table = context.supabase; const results = await Promise.all([
  table.from("instruments").select("id", { count: "exact", head: true }).is("archived_at", null),
  table.from("instruments").select("id", { count: "exact", head: true }).is("archived_at", null).eq("status", "available"),
  table.from("instruments").select("id", { count: "exact", head: true }).is("archived_at", null).eq("status", "maintenance"),
  table.from("profiles").select("id", { count: "exact", head: true }),
  table.from("bookings").select("id", { count: "exact", head: true }).eq("status", "confirmed").gte("start_time", now.toISOString()),
  table.from("bookings").select("id", { count: "exact", head: true }).gte("start_time", day.start).lt("start_time", day.end),
]); const error = results.find(item => item.error)?.error; if (error) { console.error("Admin dashboard query failed", { code: error.code }); return { data: null, error: "Dashboard statistics could not be loaded." }; } return { data: { totalInstruments: results[0].count ?? 0, availableInstruments: results[1].count ?? 0, maintenanceInstruments: results[2].count ?? 0, totalUsers: results[3].count ?? 0, upcomingBookings: results[4].count ?? 0, todaysBookings: results[5].count ?? 0 } satisfies AdminDashboardStats, error: null }; }
