import type { BookingStatus } from "@/types/booking";

export type UsageInterval = {
  start_time: string;
  end_time: string;
  status: BookingStatus;
};

export function overlapHours(bookingStart: string, bookingEnd: string, queryStart: string, queryEnd: string) {
  const effectiveStart = Math.max(Date.parse(bookingStart), Date.parse(queryStart));
  const effectiveEnd = Math.min(Date.parse(bookingEnd), Date.parse(queryEnd));
  if (![effectiveStart, effectiveEnd].every(Number.isFinite)) return 0;
  return Math.max(0, effectiveEnd - effectiveStart) / 3_600_000;
}

export function summarizeUsageHours(bookings: UsageInterval[], queryStart: string, queryEnd: string) {
  const countedHours = bookings
    .filter((booking) => booking.status === "confirmed" || booking.status === "completed")
    .map((booking) => overlapHours(booking.start_time, booking.end_time, queryStart, queryEnd))
    .filter((hours) => hours > 0);

  return {
    bookingCount: countedHours.length,
    totalHours: countedHours.reduce((total, hours) => total + hours, 0),
  };
}
