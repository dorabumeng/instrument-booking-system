import type { BookingInput } from "@/types/booking";
import type { FieldErrors } from "@/types/action-result";

export type ValidBookingInput = { startTime: string; endTime: string; sampleName: string; purpose: string; notes: string | null };
export function validateBookingInput(input: BookingInput): { value: ValidBookingInput | null; fieldErrors: FieldErrors } {
  const fieldErrors: FieldErrors = {}; const start = new Date(input.startTime); const end = new Date(input.endTime); const sampleName = input.sampleName.trim(); const purpose = input.purpose.trim(); const notes = input.notes.trim();
  if (!input.startTime || Number.isNaN(start.getTime())) fieldErrors.startTime = "Choose a valid start date and time.";
  if (!input.endTime || Number.isNaN(end.getTime())) fieldErrors.endTime = "Choose a valid end date and time.";
  if (!fieldErrors.startTime && !fieldErrors.endTime && end <= start) fieldErrors.endTime = "End time must be later than start time.";
  if (!fieldErrors.startTime && start <= new Date()) fieldErrors.startTime = "Booking time must be in the future.";
  if (sampleName.length < 2 || sampleName.length > 120) fieldErrors.sampleName = "Sample name must be 2–120 characters.";
  if (purpose.length < 3 || purpose.length > 1000) fieldErrors.purpose = "Purpose must be 3–1,000 characters.";
  if (notes.length > 4000) fieldErrors.notes = "Notes cannot exceed 4,000 characters.";
  return Object.keys(fieldErrors).length ? { value: null, fieldErrors } : { value: { startTime: start.toISOString(), endTime: end.toISOString(), sampleName, purpose, notes: notes || null }, fieldErrors };
}
