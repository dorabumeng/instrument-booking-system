export type BookingStatus = "confirmed" | "cancelled" | "completed";
export interface Booking { id: string; instrument_id: string; user_id: string; start_time: string; end_time: string; sample_name: string; sample_count: number; purpose: string; notes: string | null; status: BookingStatus; cancelled_at: string | null; cancelled_by: string | null; cancellation_reason: string | null; created_at: string; updated_at: string; }
export interface BookingWithInstrument extends Booking { instrument: import("./instrument").Instrument; }
export type BookingInput = { startTime: string; endTime: string; sampleName: string; sampleCount: number; purpose: string; notes: string };
export type CalendarBooking = Pick<Booking, "id" | "instrument_id" | "start_time" | "end_time" | "sample_name" | "sample_count" | "purpose" | "notes" | "status">;
export interface AdminBooking extends Booking { instrument: import("./instrument").Instrument; user: import("./database").Profile; ledger: import("./ledger").LedgerDetail | null; }
