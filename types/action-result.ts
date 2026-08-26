export type ActionErrorCode = "UNAUTHENTICATED" | "VALIDATION_ERROR" | "BOOKING_CONFLICT" | "INSTRUMENT_UNAVAILABLE" | "FORBIDDEN" | "NOT_FOUND" | "DATABASE_ERROR";
export type FieldErrors = Partial<Record<"startTime" | "endTime" | "sampleName" | "purpose" | "notes", string>>;
export type ActionResult<T> = { success: true; data: T; message: string } | { success: false; code: ActionErrorCode; message: string; fieldErrors?: FieldErrors };
