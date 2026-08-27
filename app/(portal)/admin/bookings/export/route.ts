import type { NextRequest } from "next/server";
import { getLedgerBookings } from "@/lib/admin/ledger";
import { buildLedgerWorkbook } from "@/lib/admin/ledger-workbook";
import { getLabTimezone } from "@/lib/config/env";
import { DateTime } from "luxon";

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from"); const to = request.nextUrl.searchParams.get("to");
  if (!from || !to) return new Response("Start date and end date are required.", { status: 400 });
  const result = await getLedgerBookings({ from, to, instrument: request.nextUrl.searchParams.get("instrument") ?? undefined, status: request.nextUrl.searchParams.get("status") ?? undefined, zone: getLabTimezone() });
  if (result.error === "FORBIDDEN") return new Response("Forbidden", { status: 403 });
  if (result.error === "INVALID_RANGE") return new Response("Choose a valid range of three years or less.", { status: 400 });
  if (!result.data) return new Response("Export could not be generated.", { status: 500 });
  const firstYear = DateTime.fromISO(from).year; const lastYear = DateTime.fromISO(to).year; const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index); const buffer = await buildLedgerWorkbook(result.data, getLabTimezone(), years);
  return new Response(new Uint8Array(buffer), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="SUSTech-laboratory-ledger-${from}-${to}.xlsx"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
