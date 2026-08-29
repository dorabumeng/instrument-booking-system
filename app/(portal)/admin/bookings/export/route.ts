import type { NextRequest } from "next/server";
import { getLedgerBookings } from "@/lib/admin/ledger";
import { buildLedgerWorkbook } from "@/lib/admin/ledger-workbook";
import { getLabTimezone } from "@/lib/config/env";
import { DateTime } from "luxon";

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from"); const to = request.nextUrl.searchParams.get("to");
  if (!from || !to) return new Response("请选择开始日期和结束日期。", { status: 400 });
  const result = await getLedgerBookings({ from, to, instrument: request.nextUrl.searchParams.get("instrument") ?? undefined, status: request.nextUrl.searchParams.get("status") ?? undefined, zone: getLabTimezone() });
  if (result.error === "FORBIDDEN") return new Response("Forbidden", { status: 403 });
  if (result.error === "INVALID_RANGE") return new Response("请选择不超过三年的有效日期范围。", { status: 400 });
  if (!result.data) return new Response("导出文件生成失败，请稍后重试。", { status: 500 });
  const firstYear = DateTime.fromISO(from).year; const lastYear = DateTime.fromISO(to).year; const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index); const buffer = await buildLedgerWorkbook(result.data, getLabTimezone(), years);
  return new Response(new Uint8Array(buffer), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="SUSTech-laboratory-ledger-${from}-${to}.xlsx"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
