"use server";
import { revalidatePath } from "next/cache";
import { getAdminContext } from "./auth";
import { mapAdminError } from "./errors";
import type { AdminResult } from "@/types/admin";
import type { LedgerDetail, LedgerInput } from "@/types/ledger";

export async function saveLedgerDetails(bookingId: string, input: LedgerInput): Promise<AdminResult<LedgerDetail>> {
  const context = await getAdminContext(); if (!context) return { success: false, code: "FORBIDDEN", message: "Administrator permission is required." };
  const sampleCount = Number(input.sample_count ?? 1); const statisticalHours = input.statistical_hours == null ? null : Number(input.statistical_hours); const contractAmount = input.contract_amount == null ? null : Number(input.contract_amount);
  if (!Number.isInteger(sampleCount) || sampleCount < 0 || sampleCount > 1000000 || (statisticalHours != null && (!Number.isFinite(statisticalHours) || statisticalHours < 0)) || (contractAmount != null && (!Number.isFinite(contractAmount) || contractAmount < 0))) return { success: false, code: "VALIDATION_ERROR", message: "Check ledger numeric fields." };
  const value = { booking_id: bookingId, sample_count: sampleCount, statistical_hours: statisticalHours, payer_name: input.payer_name?.trim() || null, payer_organization: input.payer_organization?.trim() || null, billing_status: input.billing_status ?? "pending", contract_status: input.contract_status ?? "not_required", contract_amount: contractAmount, evaluation_status: input.evaluation_status ?? "not_required", survey_status: input.survey_status ?? "not_required" };
  const { data, error } = await context.supabase.from("booking_ledger_details").upsert(value).select().single(); if (error) return mapAdminError(error);
  revalidatePath("/admin/bookings"); return { success: true, data, message: "University ledger details saved." };
}
