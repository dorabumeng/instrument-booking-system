import type { ActionResult } from "@/types/action-result";
type DatabaseError = { code?: string; message?: string; details?: string | null };
export function mapBookingError(error: DatabaseError): ActionResult<never> {
  if (error.code === "23P01" || error.message?.includes("no_overlapping_confirmed_bookings")) return { success: false, code: "BOOKING_CONFLICT", message: "This time slot was just booked by another user. Please choose another time." };
  if (error.message?.includes("BOOKING_SLOT_MISALIGNED")) return { success: false, code: "VALIDATION_ERROR", message: "The selected times do not align with this instrument's booking interval." };
  if (error.message?.includes("BOOKING_BELOW_MINIMUM")) return { success: false, code: "VALIDATION_ERROR", message: "The selected booking is shorter than this instrument's minimum duration." };
  if (error.message?.includes("BOOKING_ABOVE_MAXIMUM")) return { success: false, code: "VALIDATION_ERROR", message: "The selected booking exceeds this instrument's maximum duration." };
  if (error.code === "23514" || error.message?.toLowerCase().includes("instrument is not available")) return { success: false, code: "INSTRUMENT_UNAVAILABLE", message: "This instrument is not currently available for booking." };
  if (error.code === "42501" || error.code === "PGRST301") return { success: false, code: "FORBIDDEN", message: "You do not have permission to change this booking." };
  if (error.code === "PGRST116") return { success: false, code: "NOT_FOUND", message: "The booking could not be found or is no longer editable." };
  console.error("Booking database operation failed", { code: error.code });
  return { success: false, code: "DATABASE_ERROR", message: "The booking could not be saved. Please try again." };
}
