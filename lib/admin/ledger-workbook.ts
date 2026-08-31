import ExcelJS from "exceljs";
import { DateTime } from "luxon";
import type { AdminBooking } from "@/types/booking";

export const LEDGER_HEADERS = ["序号", "使用编号", "仪器名称", "资产编号", "使用者", "所属单位", "使用开始时间", "使用结束时间", "使用时长(小时)", "统计时长(小时)", "样品数", "付费人", "付费人机构", "扣费状态", "是否签订合同", "合同金额\n（元）", "用户评价表", "用户调研"] as const;
const billing = { pending: "待扣费", charged: "已结算", exempt: "免收费", not_applicable: "不适用" } as const;
const contract = { signed: "是", not_signed: "否", not_required: "无需填写" } as const;
const evaluation = { submitted: "已提交", not_submitted: "未提交", not_required: "无需填写" } as const;
const survey = { completed: "已完成", not_completed: "未完成", not_required: "无需填写" } as const;
const widths = [5, 15.125, 21, 8.5, 6.75, 22.25, 19, 19, 14.375, 14.375, 6.75, 6.75, 22, 8.5, 14.625, 14.75, 11.5, 11.25];
const thinBorder: Partial<ExcelJS.Borders> = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };

export function durationHours(start: string, end: string) { return Math.round(((new Date(end).getTime() - new Date(start).getTime()) / 3600000) * 1000) / 1000; }
export function usageNumber(item: Pick<AdminBooking, "start_time">, zone: string, dailyUseNumber = 1) { const date = DateTime.fromISO(item.start_time).setZone(zone).toFormat("yyyy-LL-dd"); return `${date}-${String(dailyUseNumber).padStart(4, "0")}`; }
export function ledgerRow(item: AdminBooking, index: number, zone: string, dailyUseNumber = 1) { const hours = durationHours(item.start_time, item.end_time); const detail = item.ledger; return [index, usageNumber(item, zone, dailyUseNumber), item.instrument.name, item.instrument.asset_number ?? "", item.user.full_name, item.user.group_name ?? "", DateTime.fromISO(item.start_time).setZone(zone).toFormat("yyyy-LL-dd HH:mm"), DateTime.fromISO(item.end_time).setZone(zone).toFormat("yyyy-LL-dd HH:mm"), hours, detail?.statistical_hours ?? hours, item.sample_count ?? detail?.sample_count ?? 1, detail?.payer_name ?? "", detail?.payer_organization ?? "", billing[detail?.billing_status ?? "pending"], contract[detail?.contract_status ?? "not_required"], detail?.contract_amount ?? null, evaluation[detail?.evaluation_status ?? "not_required"], survey[detail?.survey_status ?? "not_required"]]; }

export async function buildLedgerWorkbook(items: AdminBooking[], zone: string, years: number[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SUSTech Low-Dimensional Magnetic Materials Laboratory Booking System";
  for (const year of years) {
    const sheet = workbook.addWorksheet(`${year}年度`, { views: [{ state: "normal", showGridLines: true, zoomScale: 100 }] });
    sheet.pageSetup = { paperSize: 9, orientation: "portrait", scale: 100, fitToWidth: 1, fitToHeight: 1, margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 } };
    sheet.columns = widths.map(width => ({ width }));
    const header = sheet.addRow([...LEDGER_HEADERS]);
    header.height = 26.25;
    header.eachCell((cell, column) => { cell.font = { name: "宋体", family: 3, size: 10, bold: true, color: column >= 15 ? { argb: "FFFF0000" } : { argb: "FF000000" } }; cell.alignment = { horizontal: "center", vertical: "middle", wrapText: column === 16 }; cell.border = thinBorder; cell.fill = { type: "pattern", pattern: "none" }; });
    const annual = items.filter(item => DateTime.fromISO(item.start_time).setZone(zone).year === year).sort((a, b) => a.start_time.localeCompare(b.start_time));
    const dailyCounts = new Map<string, number>();
    annual.forEach((item, index) => {
      const day = DateTime.fromISO(item.start_time).setZone(zone).toISODate()!;
      const dailyUseNumber = (dailyCounts.get(day) ?? 0) + 1;
      dailyCounts.set(day, dailyUseNumber);
      const row = sheet.addRow(ledgerRow(item, index + 1, zone, dailyUseNumber));
      row.height = 36.75;
      row.eachCell({ includeEmpty: true }, (cell, column) => { cell.font = { name: "宋体", family: 3, size: 10, color: column >= 15 ? { argb: "FFFF0000" } : { argb: "FF000000" } }; cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }; cell.border = thinBorder; cell.fill = { type: "pattern", pattern: "none" }; });
    });
    sheet.getColumn(9).numFmt = "0.00";
    sheet.getColumn(10).numFmt = "0.00";
    sheet.getColumn(11).numFmt = "0";
    sheet.getColumn(16).numFmt = "#,##0.00";
  }
  return workbook.xlsx.writeBuffer();
}
