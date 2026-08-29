import "server-only";
import { DateTime } from "luxon";
import { getAdminContext } from "./auth";
import { getLabTimezone } from "@/lib/config/env";
import { overlapHours, summarizeUsageHours } from "./usage-hours";
import type { BookingStatus } from "@/types/booking";

export type UsageStatisticsFilters = {
  usageInstrument?: string;
  usageStart?: string;
  usageEnd?: string;
};

type UsageRow = {
  id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  user: { full_name: string };
};

export type UsageStatistics = {
  instrumentName: string;
  queryStart: string;
  queryEnd: string;
  bookingCount: number;
  totalHours: number;
  details: Array<UsageRow & { countedHours: number }>;
};

export type UsageStatisticsResult =
  | { state: "idle" }
  | { state: "error"; code: "MISSING_INSTRUMENT" | "MISSING_START" | "MISSING_END" | "INVALID_RANGE" | "DATABASE_ERROR" }
  | { state: "success"; data: UsageStatistics };

function laboratoryIso(value: string | undefined, zone: string) {
  if (!value) return null;
  const parsed = DateTime.fromISO(value, { zone, setZone: true });
  return parsed.isValid ? parsed.toUTC().toISO({ suppressMilliseconds: true }) : null;
}

export async function getInstrumentUsageStatistics(filters: UsageStatisticsFilters): Promise<UsageStatisticsResult> {
  const requested = Boolean(filters.usageInstrument || filters.usageStart || filters.usageEnd);
  if (!requested) return { state: "idle" };
  if (!filters.usageInstrument) return { state: "error", code: "MISSING_INSTRUMENT" };
  if (!filters.usageStart) return { state: "error", code: "MISSING_START" };
  if (!filters.usageEnd) return { state: "error", code: "MISSING_END" };

  const zone = getLabTimezone();
  const queryStart = laboratoryIso(filters.usageStart, zone);
  const queryEnd = laboratoryIso(filters.usageEnd, zone);
  if (!queryStart || !queryEnd || Date.parse(queryStart) >= Date.parse(queryEnd)) return { state: "error", code: "INVALID_RANGE" };

  const context = await getAdminContext();
  if (!context) return { state: "error", code: "DATABASE_ERROR" };
  const [instrument, bookings] = await Promise.all([
    context.supabase.from("instruments").select("id,name").eq("id", filters.usageInstrument).maybeSingle(),
    context.supabase
      .from("bookings")
      .select("id,start_time,end_time,status,user:profiles!bookings_user_id_fkey(full_name)")
      .eq("instrument_id", filters.usageInstrument)
      .in("status", ["confirmed", "completed"])
      .lt("start_time", queryEnd)
      .gt("end_time", queryStart)
      .order("start_time", { ascending: true }),
  ]);

  if (instrument.error || bookings.error || !instrument.data) {
    console.error("Admin usage statistics query failed", { instrumentCode: instrument.error?.code, bookingCode: bookings.error?.code });
    return { state: "error", code: "DATABASE_ERROR" };
  }

  const rows = (bookings.data ?? []) as UsageRow[];
  const summary = summarizeUsageHours(rows, queryStart, queryEnd);
  return {
    state: "success",
    data: {
      instrumentName: instrument.data.name,
      queryStart,
      queryEnd,
      ...summary,
      details: rows.map((row) => ({ ...row, countedHours: overlapHours(row.start_time, row.end_time, queryStart, queryEnd) })).filter((row) => row.countedHours > 0),
    },
  };
}
