import type { Json, Profile, UserRole } from "./database";
import type { Instrument, InstrumentStatus } from "./instrument";

export type AdminErrorCode = "VALIDATION_ERROR" | "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "LAST_ADMIN" | "HAS_FUTURE_BOOKINGS" | "DATABASE_ERROR";
export type AdminResult<T> = { success: true; data: T; message: string } | { success: false; code: AdminErrorCode; message: string; fieldErrors?: Record<string, string>; futureBookingCount?: number };
export type InstrumentAdminInput = { name: string; description: string; location: string; manager: string; status: InstrumentStatus; imageUrl: string; assetNumber: string; bookingSlotMinutes: number | null; minBookingMinutes: number | null; maxBookingMinutes: number | null };
export type AdminInstrument = Instrument & { future_booking_count: number };
export type AdminUser = Profile;
export type RoleChangeInput = { userId: string; role: UserRole; confirmed: boolean };
export type AuditLog = { id: number; actor_user_id: string | null; action: string; entity_type: string; entity_id: string | null; metadata: Json; created_at: string; actor: Pick<Profile, "id" | "full_name" | "email"> | null };
export type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number; pageCount: number };
